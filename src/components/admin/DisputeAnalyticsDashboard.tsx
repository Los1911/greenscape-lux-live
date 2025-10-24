import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { CalendarIcon, Download, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DisputeAnalytics {
  totalDisputes: number;
  pendingDisputes: number;
  resolvedDisputes: number;
  rejectedDisputes: number;
  averageResolutionTime: number;
  resolutionRate: number;
  trendsData: Array<{ date: string; disputes: number; resolved: number }>;
  reasonsData: Array<{ reason: string; count: number }>;
  statusData: Array<{ status: string; count: number }>;
  resolutionTimeData: Array<{ range: string; count: number }>;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

export function DisputeAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<DisputeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [selectedLandscaper, setSelectedLandscaper] = useState<string>('all');
  const [landscapers, setLandscapers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchLandscapers();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedLandscaper]);

  const fetchLandscapers = async () => {
    const { data } = await supabase
      .from('landscapers')
      .select('id, business_name')
      .order('business_name');
    
    if (data) {
      setLandscapers(data.map(l => ({ id: l.id, name: l.business_name })));
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payout_disputes')
        .select('*, landscapers(business_name)')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (selectedLandscaper !== 'all') {
        query = query.eq('landscaper_id', selectedLandscaper);
      }

      const { data: disputes } = await query;

      if (disputes) {
        const total = disputes.length;
        const pending = disputes.filter(d => d.status === 'pending').length;
        const resolved = disputes.filter(d => d.status === 'resolved').length;
        const rejected = disputes.filter(d => d.status === 'rejected').length;

        const resolvedDisputes = disputes.filter(d => d.resolved_at);
        const avgTime = resolvedDisputes.length > 0
          ? resolvedDisputes.reduce((acc, d) => {
              const created = new Date(d.created_at).getTime();
              const resolved = new Date(d.resolved_at).getTime();
              return acc + (resolved - created);
            }, 0) / resolvedDisputes.length / (1000 * 60 * 60)
          : 0;

        const trendsData = generateTrendsData(disputes);
        const reasonsData = generateReasonsData(disputes);
        const statusData = [
          { status: 'Pending', count: pending },
          { status: 'Under Review', count: disputes.filter(d => d.status === 'under_review').length },
          { status: 'Resolved', count: resolved },
          { status: 'Rejected', count: rejected }
        ];
        const resolutionTimeData = generateResolutionTimeData(resolvedDisputes);

        setAnalytics({
          totalDisputes: total,
          pendingDisputes: pending,
          resolvedDisputes: resolved,
          rejectedDisputes: rejected,
          averageResolutionTime: avgTime,
          resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
          trendsData,
          reasonsData,
          statusData,
          resolutionTimeData
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendsData = (disputes: any[]) => {
    const days = 30;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'MMM dd');
      const dayDisputes = disputes.filter(d => 
        format(new Date(d.created_at), 'MMM dd') === dateStr
      );
      const dayResolved = dayDisputes.filter(d => d.status === 'resolved');
      data.push({
        date: dateStr,
        disputes: dayDisputes.length,
        resolved: dayResolved.length
      });
    }
    return data;
  };

  const generateReasonsData = (disputes: any[]) => {
    const reasons: { [key: string]: number } = {};
    disputes.forEach(d => {
      reasons[d.reason] = (reasons[d.reason] || 0) + 1;
    });
    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const generateResolutionTimeData = (disputes: any[]) => {
    const ranges = [
      { range: '< 24h', min: 0, max: 24, count: 0 },
      { range: '1-3 days', min: 24, max: 72, count: 0 },
      { range: '3-7 days', min: 72, max: 168, count: 0 },
      { range: '> 7 days', min: 168, max: Infinity, count: 0 }
    ];

    disputes.forEach(d => {
      const hours = (new Date(d.resolved_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60);
      const range = ranges.find(r => hours >= r.min && hours < r.max);
      if (range) range.count++;
    });

    return ranges;
  };

  const exportToCSV = () => {
    if (!analytics) return;
    
    const csv = [
      ['Dispute Analytics Report'],
      [`Date Range: ${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`],
      [''],
      ['Metric', 'Value'],
      ['Total Disputes', analytics.totalDisputes],
      ['Pending Disputes', analytics.pendingDisputes],
      ['Resolved Disputes', analytics.resolvedDisputes],
      ['Rejected Disputes', analytics.rejectedDisputes],
      ['Average Resolution Time (hours)', analytics.averageResolutionTime.toFixed(2)],
      ['Resolution Rate (%)', analytics.resolutionRate.toFixed(2)]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispute-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dispute Analytics</h2>
        <div className="flex gap-4">
          <Select value={selectedLandscaper} onValueChange={setSelectedLandscaper}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Landscapers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Landscapers</SelectItem>
              {landscapers.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDisputes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageResolutionTime.toFixed(1)}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.resolutionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <XCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingDisputes}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dispute Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="disputes" stroke="#8b5cf6" name="Total Disputes" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disputes by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Dispute Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.reasonsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="reason" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolution Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.resolutionTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
