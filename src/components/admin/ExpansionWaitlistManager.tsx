import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, MapPin, Send, TrendingUp, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface ZipStats {
  zip_code: string;
  total_count: number;
  notified_count: number;
  converted_count: number;
  conversion_rate: number;
  latest_signup: string;
  service_interests: string[][];
}

export function ExpansionWaitlistManager() {
  const { user, loading: authLoading } = useAuth();
  const [zipStats, setZipStats] = useState<ZipStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadWaitlistStats();
  }, [authLoading, user]);

  const loadWaitlistStats = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase.rpc('get_waitlist_zip_stats');
      if (fetchError) throw fetchError;
      setZipStats(data || []);
    } catch (err) {
      console.error('[WAITLIST_ADMIN] Error:', err);
      setError('Failed to load waitlist data');
    } finally {
      setLoading(false);
    }
  };

  const activateArea = async (zipCode: string) => {
    try {
      setActivating(zipCode);
      const { data, error } = await supabase.functions.invoke('activate-waitlist-area', { body: { zipCode } });
      if (error) throw error;
      alert(`Notified ${data?.notified || 0} members in ${zipCode}`);
      loadWaitlistStats();
    } catch (err) {
      console.error('[WAITLIST_ADMIN] Activation error:', err);
      alert('Failed to activate area');
    } finally {
      setActivating(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['ZIP Code', 'Total', 'Notified', 'Converted', 'Conversion Rate', 'Latest Signup'];
    const rows = zipStats.map(stat => [stat.zip_code, stat.total_count, stat.notified_count, stat.converted_count, `${stat.conversion_rate}%`, new Date(stat.latest_signup).toLocaleDateString()]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getHeatmapColor = (count: number) => {
    if (count >= 50) return 'bg-emerald-500';
    if (count >= 30) return 'bg-emerald-400';
    if (count >= 15) return 'bg-emerald-300';
    if (count >= 5) return 'bg-emerald-200';
    return 'bg-emerald-100';
  };

  const filteredStats = zipStats.filter(stat => {
    if (serviceFilter !== 'all') {
      const hasService = stat.service_interests?.some(interests => interests?.includes(serviceFilter));
      if (!hasService) return false;
    }
    if (dateFilter !== 'all') {
      const daysAgo = Math.floor((Date.now() - new Date(stat.latest_signup).getTime()) / (1000 * 60 * 60 * 24));
      if (dateFilter === '7' && daysAgo > 7) return false;
      if (dateFilter === '30' && daysAgo > 30) return false;
    }
    return true;
  });

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" /></div>;
  }

  if (!user) {
    return <Card><CardContent className="py-12 text-center text-gray-500">Please sign in to manage waitlist.</CardContent></Card>;
  }

  if (error) {
    return <Card><CardContent className="py-12 text-center"><p className="text-red-500 mb-4">{error}</p><Button onClick={loadWaitlistStats}><RefreshCw className="h-4 w-4 mr-2" />Retry</Button></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-emerald-900">Expansion Waitlist Manager</h2>
        <Button onClick={exportToCSV} variant="outline" className="gap-2"><Download className="w-4 h-4" />Export CSV</Button>
      </div>

      <Card><CardContent className="pt-6"><div className="flex gap-4">
        <div className="flex-1"><label className="text-sm font-medium mb-2 block">Service Interest</label><Select value={serviceFilter} onValueChange={setServiceFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Services</SelectItem><SelectItem value="Lawn Care">Lawn Care</SelectItem><SelectItem value="Garden Design">Garden Design</SelectItem><SelectItem value="Tree Services">Tree Services</SelectItem></SelectContent></Select></div>
        <div className="flex-1"><label className="text-sm font-medium mb-2 block">Signup Date</label><Select value={dateFilter} onValueChange={setDateFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Time</SelectItem><SelectItem value="7">Last 7 Days</SelectItem><SelectItem value="30">Last 30 Days</SelectItem></SelectContent></Select></div>
      </div></CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-600" />Demand Heatmap</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredStats.slice(0, 24).map(stat => (<div key={stat.zip_code} className={`${getHeatmapColor(stat.total_count)} rounded-lg p-4 text-center`}><div className="text-lg font-bold text-emerald-900">{stat.zip_code}</div><div className="text-2xl font-bold text-emerald-700">{stat.total_count}</div></div>))}
        </div>
      </CardContent></Card>

      {loading && <div className="text-center py-12"><RefreshCw className="inline-block h-8 w-8 text-emerald-600 animate-spin" /></div>}
      {!loading && filteredStats.length === 0 && <Card><CardContent className="py-12 text-center text-gray-500">No waitlist entries found</CardContent></Card>}
    </div>
  );
}
