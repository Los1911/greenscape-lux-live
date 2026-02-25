import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, DollarSign, Clock, CheckCircle, XCircle, Calendar as CalendarIcon, Settings, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PayoutDisputeForm } from './PayoutDisputeForm';


interface Payout {
  id: string;
  amount: number;
  status: string;
  payout_date: string;
  arrival_date: string;
  job_ids: string[];
  stripe_payout_id: string;
  failure_message?: string;
}

interface PayoutSchedule {
  schedule_type: string;
  minimum_payout: number;
  payout_day?: number;
  auto_payout_enabled: boolean;
  next_payout_date: string;
  last_payout_date?: string;
}

export default function PayoutDashboard() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [schedule, setSchedule] = useState<PayoutSchedule | null>(null);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    loadPayoutData();
  }, []);

  const loadPayoutData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: landscaper } = await supabase
        .from('landscapers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!landscaper) return;

      // Load payouts
      let query = supabase
        .from('payouts')
        .select('*')
        .eq('landscaper_id', landscaper.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateRange.from) {
        query = query.gte('payout_date', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        query = query.lte('payout_date', dateRange.to.toISOString());
      }

      const { data: payoutsData } = await query;
      setPayouts(payoutsData || []);

      // Load schedule
      const { data: scheduleData } = await supabase
        .from('payout_schedules')
        .select('*')
        .eq('landscaper_id', landscaper.id)
        .single();

      setSchedule(scheduleData);

      // Calculate pending earnings
      const { data: jobs } = await supabase
        .from('jobs')
        .select('price')
        .eq('landscaper_id', landscaper.id)
        .eq('status', 'completed')
        .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .is('payout_id', null);

      const pending = jobs?.reduce((sum, job) => sum + ((job.price || 0) * 0.9), 0) || 0;
      setPendingEarnings(pending);

      setPendingEarnings(pending);

    } catch (error) {
      console.error('Error loading payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPayouts = () => {
    const csv = [
      ['Date', 'Amount', 'Status', 'Arrival Date', 'Jobs', 'Stripe ID'].join(','),
      ...payouts.map(p => [
        format(new Date(p.payout_date), 'yyyy-MM-dd'),
        p.amount.toFixed(2),
        p.status,
        p.arrival_date ? format(new Date(p.arrival_date), 'yyyy-MM-dd') : '',
        p.job_ids.length,
        p.stripe_payout_id || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      paid: { variant: 'default', icon: CheckCircle, color: 'text-green-500' },
      processing: { variant: 'secondary', icon: Clock, color: 'text-blue-500' },
      pending: { variant: 'outline', icon: Clock, color: 'text-yellow-500' },
      failed: { variant: 'destructive', icon: XCircle, color: 'text-red-500' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {schedule && `Min. payout: $${schedule.minimum_payout}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedule?.next_payout_date 
                ? format(new Date(schedule.next_payout_date), 'MMM dd')
                : 'Not scheduled'}
            </div>
            <p className="text-xs text-muted-foreground">
              {schedule?.schedule_type || 'No schedule set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payouts.filter(p => p.status === 'paid').length} payouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>View and export your payout history</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportPayouts}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateRange.from ? format(dateRange.from, 'MMM dd') : 'Date range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange(range || {})}
                />
              </PopoverContent>
            </Popover>

            {(statusFilter !== 'all' || dateRange.from) && (
              <Button variant="ghost" size="sm" onClick={() => {
                setStatusFilter('all');
                setDateRange({});
                loadPayoutData();
              }}>
                Clear filters
              </Button>
            )}
          </div>

          {/* Payout List */}
          <div className="space-y-4">
            {payouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold">${payout.amount.toFixed(2)}</div>
                    {getStatusBadge(payout.status)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {format(new Date(payout.payout_date), 'MMM dd, yyyy')}
                    {payout.arrival_date && ` • Arrives ${format(new Date(payout.arrival_date), 'MMM dd')}`}
                    {` • ${payout.job_ids.length} jobs`}
                  </div>
                  {payout.failure_message && (
                    <div className="text-sm text-red-500 mt-1">{payout.failure_message}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(payout.status === 'failed' || payout.status === 'pending') && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Dispute
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Submit Payout Dispute</DialogTitle>
                        </DialogHeader>
                        <PayoutDisputeForm
                          payoutId={payout.id}
                          onSuccess={() => {
                            loadPayoutData();
                          }}
                          onCancel={() => {}}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  {payout.stripe_payout_id && (
                    <code className="text-xs">{payout.stripe_payout_id.slice(0, 20)}...</code>
                  )}
                </div>
              </div>
            ))}


            {payouts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No payouts found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}