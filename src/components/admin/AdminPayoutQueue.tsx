import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  User,
  Briefcase,
  Calendar,
  PauseCircle,
  Eye,
  X,
  ShieldAlert
} from 'lucide-react';


interface PayoutEligibleJob {
  id: string;
  title: string;
  service_type: string;
  completed_at: string;
  payout_status: string;
  payout_amount: number | null;
  
  payment_id: string | null;
  payment_amount: number | null;
  payment_status: string | null;
  platform_commission: number | null;

  landscaper_payout: number | null;
  
  landscaper_id: string;
  landscaper_name: string;
  landscaper_business_name: string;
  landscaper_email: string;
  
  client_name: string;
  client_email: string;
  
  client_paid: boolean;

  payout_released_at: string | null;
  payout_released_by: string | null;
}



interface PayoutStats {
  totalEligible: number;
  totalAmount: number;
  pendingCount: number;
  heldCount: number;
}

export default function AdminPayoutQueue() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<PayoutEligibleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<PayoutStats>({
    totalEligible: 0,
    totalAmount: 0,
    pendingCount: 0,
    heldCount: 0
  });
  const [selectedJob, setSelectedJob] = useState<PayoutEligibleJob | null>(null);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'ready_for_release' | 'on_hold'>('all');

  // Only 'ready_for_release' is eligible for payout release per DB constraint:
  // jobs_payout_status_check: unpaid | ready_for_release | processing | paid | failed | on_hold
  const isReleasable = (status: string) => status === 'ready_for_release';


  const fetchPayoutQueue = useCallback(async () => {
    setLoading(true);
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          service_type,
          completed_at,
          payout_status,
          payout_amount,
          payout_released_at,
          payout_released_by,
          payment_status,
          client_paid,
          landscaper_id,
          client_id,
          customer_name,
          payment_amount_cents
        `)
        .eq('status', 'completed')
        .eq('client_paid', true)
        .neq('payout_status', 'paid')
        .order('completed_at', { ascending: false });



      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        setLoading(false);
        return;
      }

      if (!jobsData || jobsData.length === 0) {
        setJobs([]);
        setStats({ totalEligible: 0, totalAmount: 0, pendingCount: 0, heldCount: 0 });
        setLoading(false);
        return;
      }


      const jobIds = jobsData.map(j => j.id);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, job_id, amount, status, platform_commission, landscaper_payout')

        .in('job_id', jobIds)
        .eq('status', 'succeeded');

      const paymentMap = new Map(
        (paymentsData || []).map(p => [p.job_id, p])
      );

      const landscaperIds = [...new Set(jobsData.map(j => j.landscaper_id).filter(Boolean))];
      
      const { data: landscapersData } = await supabase
        .from('landscapers')
        .select('id, user_id, business_name')
        .in('id', landscaperIds);

      const userIds = (landscapersData || []).map(l => l.user_id).filter(Boolean);
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .in('user_id', userIds);

      const landscaperMap = new Map(
        (landscapersData || []).map(l => [l.id, l])
      );
      const profileMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      const clientIds = [...new Set(jobsData.map(j => j.client_id).filter(Boolean))];
      
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, user_id')
        .in('id', clientIds);

      const clientUserIds = (clientsData || []).map(c => c.user_id).filter(Boolean);
      
      const { data: clientProfilesData } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .in('user_id', clientUserIds);


      const clientMap = new Map(
        (clientsData || []).map(c => [c.id, c])
      );
      const clientProfileMap = new Map(
        (clientProfilesData || []).map(p => [p.user_id, p])
      );

      const enrichedJobs: PayoutEligibleJob[] = jobsData
        .filter(job => {
          // Accept if payments table has a 'succeeded' record OR jobs table says payment_status = 'paid'
          const payment = paymentMap.get(job.id);
          const hasSucceededPayment = payment && payment.status === 'succeeded';
          const jobMarkedPaid = (job as any).payment_status === 'paid';
          return hasSucceededPayment || jobMarkedPaid;
        })

        .map(job => {
          const payment = paymentMap.get(job.id);
          const landscaper = landscaperMap.get(job.landscaper_id);
          const landscaperProfile = landscaper ? profileMap.get(landscaper.user_id) : null;
          const client = clientMap.get(job.client_id);
          const clientProfile = client ? clientProfileMap.get(client.user_id) : null;

          return {
            id: job.id,
            title: job.title,
            service_type: job.service_type,
            completed_at: job.completed_at,
            payout_status: job.payout_status || 'not_ready',
            // Payout amount: prefer jobs.payout_amount (authoritative), fallback to payments table
            payout_amount: job.payout_amount || payment?.landscaper_payout || null,
            payout_released_at: job.payout_released_at,
            payout_released_by: job.payout_released_by,
            
            payment_id: payment?.id || null,
            // Client Paid: use jobs.payment_amount_cents / 100 (authoritative), fallback to payments table
            payment_amount: (() => {
              const centsRaw = (job as any).payment_amount_cents;
              if (typeof centsRaw === 'number' && centsRaw > 0) return centsRaw / 100;
              if (payment?.amount && payment.amount > 0) return payment.amount;
              return null;
            })(),
            payment_status: payment?.status || null,
            platform_commission: payment?.platform_commission || null,

            // Landscaper Payout: prefer jobs.payout_amount (authoritative), fallback to payments table
            landscaper_payout: (() => {
              if (typeof job.payout_amount === 'number' && job.payout_amount > 0) return job.payout_amount;
              if (payment?.landscaper_payout && payment.landscaper_payout > 0) return payment.landscaper_payout;
              return null;
            })(),
            
            landscaper_id: job.landscaper_id,
            // Landscaper identity: full name > business_name > email. Never "Unknown".
            landscaper_name: (() => {
              const first = landscaperProfile?.first_name || '';
              const last = landscaperProfile?.last_name || '';
              const fullName = `${first} ${last}`.trim();
              if (fullName) return fullName;
              if (landscaper?.business_name) return landscaper.business_name;
              return landscaperProfile?.email || '';
            })(),
            // Only populate business_name as a subtitle when a personal name is the primary display
            landscaper_business_name: (() => {
              const first = landscaperProfile?.first_name || '';
              const last = landscaperProfile?.last_name || '';
              const fullName = `${first} ${last}`.trim();
              if (fullName && landscaper?.business_name) return landscaper.business_name;
              return '';
            })(),
            landscaper_email: landscaperProfile?.email || '',
            
            // Client Name: use jobs.customer_name (authoritative), fallback to profile lookup
            client_name: (() => {
              const customerName = ((job as any).customer_name || '').trim();
              if (customerName) return customerName;
              const first = clientProfile?.first_name || '';
              const last = clientProfile?.last_name || '';
              const fullName = `${first} ${last}`.trim();
              if (fullName) return fullName;
              return clientProfile?.email || '';
            })(),
            client_email: clientProfile?.email || '',

            // Defense-in-depth: DB query already filters client_paid = true,
            // but carry the value through for UI-level button gating.
            client_paid: (job as any).client_paid === true
          };


        });


      let filteredJobs = enrichedJobs;
      if (filter !== 'all') {
        filteredJobs = enrichedJobs.filter(j => j.payout_status === filter);
      }

      setJobs(filteredJobs);

      const totalAmount = enrichedJobs.reduce((sum, j) => sum + (j.landscaper_payout || j.payout_amount || 0), 0);
      const pendingCount = enrichedJobs.filter(j => j.payout_status === 'unpaid').length;
      const heldCount = enrichedJobs.filter(j => j.payout_status === 'on_hold').length;

      setStats({
        totalEligible: enrichedJobs.length,
        totalAmount,
        pendingCount,
        heldCount
      });


    } catch (error) {
      console.error('Error fetching payout queue:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPayoutQueue();
  }, [fetchPayoutQueue]);

  const handleReleasePayout = async (job: PayoutEligibleJob) => {
    if (!user) return;
    if (!job.client_paid) {
      alert('Cannot release payout: client has not paid for this job.');
      return;
    }
    
    setActionLoading(job.id);

    try {
      const { data, error } = await supabase.functions.invoke('release-job-payout', {
        body: {
          jobId: job.id,
          adminUserId: user.id
        }
      });

      if (error) {
        console.error('[PAYOUT] Edge function invocation error:', error);
        alert('Failed to release payout. Please try again.');
        return;
      }

      if (data && !data.success) {
        console.error('[PAYOUT] Edge function returned error:', data.error, data.code);
        alert(data.error || 'Failed to release payout.');
        return;
      }

      console.log(`[PAYOUT] Released $${data?.amount} for job ${job.id} via Stripe transfer ${data?.transferId}`);

      await fetchPayoutQueue();
      setSelectedJob(null);
      
    } catch (error) {
      console.error('[PAYOUT] Unexpected error releasing payout:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };


  const handleHoldPayout = async (job: PayoutEligibleJob) => {
    setActionLoading(job.id);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          payout_status: 'on_hold'
        })
        .eq('id', job.id);

      if (error) {
        console.error('Error holding payout:', error);
        alert('Failed to hold payout. Please try again.');
        return;
      }

      await fetchPayoutQueue();
      setSelectedJob(null);
      
    } catch (error) {
      console.error('Error holding payout:', error);
    } finally {
      setActionLoading(null);
    }
  };


  const handleMarkReady = async (job: PayoutEligibleJob) => {
    setActionLoading(job.id);
    try {
      const payoutAmount = job.landscaper_payout || job.payout_amount || 0;
      
      const { error } = await supabase
        .from('jobs')
        .update({
          payout_status: 'ready_for_release',
          payout_amount: payoutAmount
        })
        .eq('id', job.id);

      if (error) {
        console.error('Error marking ready:', error);
        alert('Failed to mark job as ready for release.');
        return;
      }

      await fetchPayoutQueue();
      
    } catch (error) {
      console.error('Error marking ready:', error);
    } finally {
      setActionLoading(null);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600">Paid</Badge>;
      case 'ready_for_release':
        return <Badge className="bg-blue-600">Ready</Badge>;
      case 'on_hold':
        return <Badge className="bg-yellow-600">On Hold</Badge>;
      case 'unpaid':
        return <Badge className="bg-purple-600">Unpaid</Badge>;
      case 'processing':
        return <Badge className="bg-orange-600">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-600">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };



  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
        <span className="ml-2 text-emerald-300">Loading payout queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="bg-black/60 border-emerald-500/25 p-2.5 sm:p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm truncate">Eligible Jobs</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.totalEligible}</p>
            </div>
            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-emerald-400 flex-shrink-0" />
          </div>
        </Card>

        <Card className="bg-black/60 border-emerald-500/25 p-2.5 sm:p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm truncate">Total Payout</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-300 truncate">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-emerald-400 flex-shrink-0" />
          </div>
        </Card>

        <Card className="bg-black/60 border-purple-500/25 p-2.5 sm:p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm truncate">Pending</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-300">{stats.pendingCount}</p>
            </div>
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-purple-400 flex-shrink-0" />
          </div>
        </Card>

        <Card className="bg-black/60 border-yellow-500/25 p-2.5 sm:p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm truncate">On Hold</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-300">{stats.heldCount}</p>
            </div>
            <PauseCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-yellow-400 flex-shrink-0" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs — use canonical DB values as keys, friendly labels for display */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: 'All' },
          { key: 'unpaid', label: 'Unpaid' },
          { key: 'ready_for_release', label: 'Ready' },
          { key: 'on_hold', label: 'On Hold' },
        ] as const).map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key)}
            className={filter === key 
              ? 'bg-emerald-600 hover:bg-emerald-700' 
              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
            }
          >
            {label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPayoutQueue()}
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 ml-auto"
        >
          <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>


      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card className="bg-black/60 border-emerald-500/25 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Pending Payouts</h3>
          <p className="text-gray-400">All eligible payouts have been processed.</p>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {jobs.map((job) => (
              <Card key={job.id} className="bg-black/60 border-emerald-500/25 p-3 sm:p-4 w-full min-w-0">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{job.title || job.service_type}</p>
                    <p className="text-gray-400 text-xs truncate">{job.service_type}</p>
                  </div>
                  {getStatusBadge(job.payout_status)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 min-w-0">
                    <User className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-white truncate block">{job.landscaper_name}</span>
                      {job.landscaper_business_name && (
                        <span className="text-gray-400 text-xs truncate block">{job.landscaper_business_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">Client Paid</span>
                    <span className="text-white font-medium">{formatCurrency(job.payment_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">Payout</span>
                    <span className="text-emerald-300 font-bold">{formatCurrency(job.landscaper_payout || job.payout_amount)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    {formatDate(job.completed_at)}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-emerald-500/15">

                  <Button size="sm" variant="outline" onClick={() => setSelectedJob(job)} className="border-emerald-500/30 text-emerald-400 flex-1">
                    <Eye className="w-4 h-4 mr-1" /> Details
                  </Button>
                  {isReleasable(job.payout_status) && (
                    <Button size="sm" onClick={() => handleReleasePayout(job)} disabled={actionLoading === job.id || !job.client_paid} className="bg-emerald-600 hover:bg-emerald-700 flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
                      {actionLoading === job.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4 mr-1" />Release</>}
                    </Button>
                  )}

                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <Card className="bg-black/60 border-emerald-500/25 overflow-visible hidden md:block">

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-emerald-500/20">
                    <th className="text-left py-3 px-4 text-emerald-300 font-medium">Job</th>
                    <th className="text-left py-3 px-4 text-emerald-300 font-medium">Landscaper</th>
                    <th className="text-left py-3 px-4 text-emerald-300 font-medium">Client Paid</th>
                    <th className="text-left py-3 px-4 text-emerald-300 font-medium">Payout Amount</th>
                    <th className="text-left py-3 px-4 text-emerald-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-emerald-300 font-medium">Completed</th>
                    <th className="text-right py-3 px-4 text-emerald-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-emerald-500/10 hover:bg-emerald-500/5">
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{job.title || job.service_type}</p>
                          <p className="text-gray-400 text-sm truncate">{job.service_type}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2 min-w-0">
                          <User className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-white truncate">{job.landscaper_name}</p>
                            {job.landscaper_business_name && (
                              <p className="text-emerald-400/70 text-xs truncate">{job.landscaper_business_name}</p>
                            )}
                            {job.landscaper_email && job.landscaper_name !== job.landscaper_email && (
                              <p className="text-gray-400 text-xs truncate">{job.landscaper_email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white font-medium">{formatCurrency(job.payment_amount)}</span>
                      </td>


                      <td className="py-3 px-4">
                        <span className="text-emerald-300 font-bold">
                          {formatCurrency(job.landscaper_payout || job.payout_amount)}
                        </span>
                        {job.platform_commission && job.platform_commission > 0 && (
                          <p className="text-gray-500 text-xs">Fee: {formatCurrency(job.platform_commission)}</p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(job.payout_status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {formatDate(job.completed_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedJob(job)} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {job.payout_status !== 'paid' && !isReleasable(job.payout_status) && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkReady(job)} disabled={actionLoading === job.id} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                              {actionLoading === job.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                          )}
                          {isReleasable(job.payout_status) && (
                            <Button size="sm" onClick={() => handleReleasePayout(job)} disabled={actionLoading === job.id || !job.client_paid} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
                              {actionLoading === job.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4 mr-1" />Release</>}
                            </Button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}


      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="bg-gray-900 border-emerald-500/30 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">Payout Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-white h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                  <p className="text-gray-400 text-sm">Job</p>
                  <p className="text-white font-medium truncate">{selectedJob.title || selectedJob.service_type}</p>
                  <p className="text-gray-500 text-sm truncate">{selectedJob.service_type}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                    <p className="text-gray-400 text-xs sm:text-sm">Client Paid</p>
                    <p className="text-white font-bold text-base sm:text-lg">{formatCurrency(selectedJob.payment_amount)}</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                    <p className="text-gray-400 text-xs sm:text-sm">Landscaper Payout</p>
                    <p className="text-emerald-300 font-bold text-base sm:text-lg">
                      {formatCurrency(selectedJob.landscaper_payout || selectedJob.payout_amount)}
                    </p>
                  </div>
                </div>

                {selectedJob.platform_commission && selectedJob.platform_commission > 0 && (
                  <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                    <p className="text-gray-400 text-sm">Platform Commission</p>
                    <p className="text-yellow-300 font-medium">{formatCurrency(selectedJob.platform_commission)}</p>
                  </div>
                )}


                <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                  <p className="text-gray-400 text-sm">Landscaper</p>
                  <p className="text-white font-medium truncate">{selectedJob.landscaper_name}</p>
                  {selectedJob.landscaper_business_name && (
                    <p className="text-emerald-400/70 text-sm truncate">{selectedJob.landscaper_business_name}</p>
                  )}
                  {selectedJob.landscaper_email && selectedJob.landscaper_name !== selectedJob.landscaper_email && (
                    <p className="text-gray-500 text-sm truncate">{selectedJob.landscaper_email}</p>
                  )}
                </div>

                <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                  <p className="text-gray-400 text-sm">Client</p>
                  <p className="text-white truncate">{selectedJob.client_name}</p>
                  {selectedJob.client_email && selectedJob.client_name !== selectedJob.client_email && (
                    <p className="text-gray-500 text-sm truncate">{selectedJob.client_email}</p>
                  )}
                </div>


                <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                  <p className="text-gray-400 text-sm">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedJob.payout_status)}</div>
                </div>

                <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                  <p className="text-gray-400 text-sm">Completed</p>
                  <p className="text-white">{formatDate(selectedJob.completed_at)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedJob.payout_status !== 'paid' && (
                <div className="space-y-3 pt-4 border-t border-emerald-500/20">
                  {/* Defense-in-depth: warn if client_paid is somehow false */}
                  {!selectedJob.client_paid && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300 font-medium text-sm">Client Payment Not Confirmed</p>
                        <p className="text-red-400/70 text-xs mt-0.5">Payout release is blocked until client payment is verified.</p>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {selectedJob.payout_status !== 'on_hold' && (
                      <Button
                        variant="outline"
                        onClick={() => handleHoldPayout(selectedJob)}
                        disabled={actionLoading === selectedJob.id}
                        className="flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <PauseCircle className="w-4 h-4 mr-2" />
                        Hold Payout
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleReleasePayout(selectedJob)}
                      disabled={actionLoading === selectedJob.id || !selectedJob.client_paid}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {actionLoading === selectedJob.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <DollarSign className="w-4 h-4 mr-2" />
                      )}
                      Release Payout
                    </Button>
                  </div>
                </div>
              )}


              {selectedJob.payout_status === 'paid' && selectedJob.payout_released_at && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Payout Released</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    Released on {formatDate(selectedJob.payout_released_at)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
