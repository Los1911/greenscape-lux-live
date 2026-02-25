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
  Eye
} from 'lucide-react';

interface PayoutEligibleJob {
  id: string;
  title: string;
  service_type: string;
  completed_at: string;
  payout_status: string;
  payout_amount: number | null;
  
  // Payment info (from join)
  payment_id: string | null;
  payment_amount: number | null;
  payment_status: string | null;
  platform_fee: number | null;
  landscaper_payout: number | null;
  
  // Landscaper info
  landscaper_id: string;
  landscaper_name: string;
  landscaper_email: string;
  
  // Client info
  client_name: string;
  
  // Payout tracking
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'ready' | 'held'>('all');

  const fetchPayoutQueue = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch completed jobs with payment info
      // Payout eligible: job.status = 'completed', payment.status = 'succeeded', payout_status != 'paid'
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
          landscaper_id,
          client_id
        `)
        .eq('status', 'completed')
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

      // Get job IDs for payment lookup
      const jobIds = jobsData.map(j => j.id);

      // Fetch payments for these jobs
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('id, job_id, amount, status, platform_fee, landscaper_payout')
        .in('job_id', jobIds)
        .eq('status', 'succeeded');

      // Create payment map
      const paymentMap = new Map(
        (paymentsData || []).map(p => [p.job_id, p])
      );

      // Get landscaper IDs for profile lookup
      const landscaperIds = [...new Set(jobsData.map(j => j.landscaper_id).filter(Boolean))];
      
      // Fetch landscaper info
      const { data: landscapersData } = await supabase
        .from('landscapers')
        .select('id, user_id, business_name')
        .in('id', landscaperIds);

      // Get user IDs for email lookup
      const userIds = (landscapersData || []).map(l => l.user_id).filter(Boolean);
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .in('user_id', userIds);

      // Create lookup maps
      const landscaperMap = new Map(
        (landscapersData || []).map(l => [l.id, l])
      );
      const profileMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      // Get client IDs for name lookup
      const clientIds = [...new Set(jobsData.map(j => j.client_id).filter(Boolean))];
      
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, user_id')
        .in('id', clientIds);

      const clientUserIds = (clientsData || []).map(c => c.user_id).filter(Boolean);
      
      const { data: clientProfilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', clientUserIds);

      const clientMap = new Map(
        (clientsData || []).map(c => [c.id, c])
      );
      const clientProfileMap = new Map(
        (clientProfilesData || []).map(p => [p.user_id, p])
      );

      // Build enriched job list - only include jobs with successful payments
      const enrichedJobs: PayoutEligibleJob[] = jobsData
        .filter(job => {
          const payment = paymentMap.get(job.id);
          return payment && payment.status === 'succeeded';
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
            payout_amount: job.payout_amount || payment?.landscaper_payout || null,
            payout_released_at: job.payout_released_at,
            payout_released_by: job.payout_released_by,
            
            payment_id: payment?.id || null,
            payment_amount: payment?.amount || null,
            payment_status: payment?.status || null,
            platform_fee: payment?.platform_fee || null,
            landscaper_payout: payment?.landscaper_payout || null,
            
            landscaper_id: job.landscaper_id,
            landscaper_name: landscaper?.business_name || 
              (landscaperProfile ? `${landscaperProfile.first_name || ''} ${landscaperProfile.last_name || ''}`.trim() : 'Unknown'),
            landscaper_email: landscaperProfile?.email || '',
            
            client_name: clientProfile 
              ? `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim() 
              : 'Unknown Client'
          };
        });

      // Apply filter
      let filteredJobs = enrichedJobs;
      if (filter !== 'all') {
        filteredJobs = enrichedJobs.filter(j => j.payout_status === filter);
      }

      setJobs(filteredJobs);

      // Calculate stats
      const totalAmount = enrichedJobs.reduce((sum, j) => sum + (j.landscaper_payout || j.payout_amount || 0), 0);
      const pendingCount = enrichedJobs.filter(j => j.payout_status === 'pending' || j.payout_status === 'not_ready').length;
      const heldCount = enrichedJobs.filter(j => j.payout_status === 'held').length;

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
    
    setActionLoading(job.id);
    try {
      const payoutAmount = job.landscaper_payout || job.payout_amount || 0;
      
      const { error } = await supabase
        .from('jobs')
        .update({
          payout_status: 'paid',
          payout_amount: payoutAmount,
          payout_released_at: new Date().toISOString(),
          payout_released_by: user.id
        })
        .eq('id', job.id);

      if (error) {
        console.error('Error releasing payout:', error);
        alert('Failed to release payout. Please try again.');
        return;
      }

      // Log the payout action (optional - for audit trail)
      console.log(`[PAYOUT] Released $${payoutAmount} for job ${job.id} to landscaper ${job.landscaper_name}`);

      // Refresh the queue
      await fetchPayoutQueue();
      setSelectedJob(null);
      
    } catch (error) {
      console.error('Error releasing payout:', error);
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
          payout_status: 'held'
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
          payout_status: 'ready',
          payout_amount: payoutAmount
        })
        .eq('id', job.id);

      if (error) {
        console.error('Error marking ready:', error);
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
      case 'ready':
        return <Badge className="bg-blue-600">Ready</Badge>;
      case 'held':
        return <Badge className="bg-yellow-600">Held</Badge>;
      case 'pending':
        return <Badge className="bg-purple-600">Pending</Badge>;
      default:
        return <Badge variant="secondary">Not Ready</Badge>;
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-emerald-500/25 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Eligible Jobs</p>
              <p className="text-2xl font-bold text-white">{stats.totalEligible}</p>
            </div>
            <Briefcase className="h-8 w-8 text-emerald-400" />
          </div>
        </Card>

        <Card className="bg-black/60 border-emerald-500/25 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Payout</p>
              <p className="text-2xl font-bold text-emerald-300">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-400" />
          </div>
        </Card>

        <Card className="bg-black/60 border-purple-500/25 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-purple-300">{stats.pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-400" />
          </div>
        </Card>

        <Card className="bg-black/60 border-yellow-500/25 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">On Hold</p>
              <p className="text-2xl font-bold text-yellow-300">{stats.heldCount}</p>
            </div>
            <PauseCircle className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'ready', 'held'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f 
              ? 'bg-emerald-600 hover:bg-emerald-700' 
              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
            }
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPayoutQueue()}
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 ml-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
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
        <Card className="bg-black/60 border-emerald-500/25 overflow-hidden">
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
                      <div>
                        <p className="text-white font-medium">{job.title || job.service_type}</p>
                        <p className="text-gray-400 text-sm">{job.service_type}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-white">{job.landscaper_name}</p>
                          <p className="text-gray-400 text-xs">{job.landscaper_email}</p>
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
                      {job.platform_fee && job.platform_fee > 0 && (
                        <p className="text-gray-500 text-xs">Fee: {formatCurrency(job.platform_fee)}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(job.payout_status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <Calendar className="w-3 h-3" />
                        {formatDate(job.completed_at)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedJob(job)}
                          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {job.payout_status !== 'paid' && job.payout_status !== 'ready' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkReady(job)}
                            disabled={actionLoading === job.id}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          >
                            {actionLoading === job.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        
                        {(job.payout_status === 'ready' || job.payout_status === 'pending') && (
                          <Button
                            size="sm"
                            onClick={() => handleReleasePayout(job)}
                            disabled={actionLoading === job.id}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {actionLoading === job.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <DollarSign className="w-4 h-4 mr-1" />
                                Release
                              </>
                            )}
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
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-900 border-emerald-500/30 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-white">Payout Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-3">
                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Job</p>
                  <p className="text-white font-medium">{selectedJob.title || selectedJob.service_type}</p>
                  <p className="text-gray-500 text-sm">{selectedJob.service_type}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Client Paid</p>
                    <p className="text-white font-bold text-lg">{formatCurrency(selectedJob.payment_amount)}</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Landscaper Payout</p>
                    <p className="text-emerald-300 font-bold text-lg">
                      {formatCurrency(selectedJob.landscaper_payout || selectedJob.payout_amount)}
                    </p>
                  </div>
                </div>

                {selectedJob.platform_fee && selectedJob.platform_fee > 0 && (
                  <div className="bg-black/40 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Platform Fee</p>
                    <p className="text-yellow-300 font-medium">{formatCurrency(selectedJob.platform_fee)}</p>
                  </div>
                )}

                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Landscaper</p>
                  <p className="text-white font-medium">{selectedJob.landscaper_name}</p>
                  <p className="text-gray-500 text-sm">{selectedJob.landscaper_email}</p>
                </div>

                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Client</p>
                  <p className="text-white">{selectedJob.client_name}</p>
                </div>

                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedJob.payout_status)}</div>
                </div>

                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Completed</p>
                  <p className="text-white">{formatDate(selectedJob.completed_at)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedJob.payout_status !== 'paid' && (
                <div className="flex gap-3 pt-4 border-t border-emerald-500/20">
                  {selectedJob.payout_status !== 'held' && (
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
                    disabled={actionLoading === selectedJob.id}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {actionLoading === selectedJob.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <DollarSign className="w-4 h-4 mr-2" />
                    )}
                    Release Payout
                  </Button>
                </div>
              )}

              {selectedJob.payout_status === 'paid' && selectedJob.payout_released_at && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle className="w-5 h-5" />
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
