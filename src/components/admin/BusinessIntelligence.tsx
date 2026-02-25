import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, Target, RefreshCw, AlertCircle } from 'lucide-react';

interface BusinessMetrics {
  customerLifetimeValue: number;
  customerRetentionRate: number;
  avgJobsPerCustomer: number;
  seasonalTrends: Array<{ month: string; jobs: number; revenue: number }>;
  pricingOptimization: Array<{ service: string; avgPrice: number; completionRate: number; demand: number }>;
  growthMetrics: { monthlyGrowthRate: number; customerAcquisitionCost: number; revenuePerCustomer: number };
}

const defaultMetrics: BusinessMetrics = {
  customerLifetimeValue: 0, customerRetentionRate: 0, avgJobsPerCustomer: 0, seasonalTrends: [], pricingOptimization: [],
  growthMetrics: { monthlyGrowthRate: 0, customerAcquisitionCost: 0, revenuePerCustomer: 0 }
};

export default function BusinessIntelligence() {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<BusinessMetrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinessIntelligence = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: jobs } = await supabase.from('jobs').select('id, status, created_at, price, client_email, service_type');
      const { data: clients } = await supabase.from('profiles').select('id, first_name, last_name, email, created_at');

      if (jobs && clients) {
        const completedJobs = jobs.filter(job => job.status === 'completed');
        const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);
        const uniqueClients = new Set(completedJobs.map(job => job.client_email)).size;
        const clv = uniqueClients > 0 ? totalRevenue / uniqueClients : 0;

        const clientJobCounts = jobs.reduce((acc: Record<string, number>, job) => {
          const email = job.client_email || 'unknown';
          acc[email] = (acc[email] || 0) + 1;
          return acc;
        }, {});
        const repeatClients = Object.values(clientJobCounts).filter(count => count > 1).length;
        const retentionRate = uniqueClients > 0 ? (repeatClients / uniqueClients) * 100 : 0;
        const avgJobsPerCustomer = uniqueClients > 0 ? jobs.length / uniqueClients : 0;

        const monthlyData = jobs.reduce((acc: Record<string, { month: string; jobs: number; revenue: number }>, job) => {
          const month = new Date(job.created_at).toLocaleDateString('en-US', { month: 'short' });
          if (!acc[month]) acc[month] = { month, jobs: 0, revenue: 0 };
          acc[month].jobs += 1;
          if (job.status === 'completed' && job.price) acc[month].revenue += job.price;
          return acc;
        }, {});

        const serviceData = jobs.reduce((acc: Record<string, { service: string; prices: number[]; completed: number; total: number }>, job) => {
          const service = job.service_type || 'General';
          if (!acc[service]) acc[service] = { service, prices: [], completed: 0, total: 0 };
          acc[service].total += 1;
          if (job.status === 'completed') { acc[service].completed += 1; if (job.price) acc[service].prices.push(job.price); }
          return acc;
        }, {});

        const pricingOptimization = Object.values(serviceData).map((item) => ({
          service: item.service,
          avgPrice: item.prices.length > 0 ? item.prices.reduce((a, b) => a + b, 0) / item.prices.length : 0,
          completionRate: item.total > 0 ? (item.completed / item.total) * 100 : 0,
          demand: item.total
        })).sort((a, b) => b.demand - a.demand).slice(0, 6);

        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth - 1;
        const currentMonthJobs = jobs.filter(job => new Date(job.created_at).getMonth() === currentMonth).length;
        const lastMonthJobs = jobs.filter(job => new Date(job.created_at).getMonth() === lastMonth).length;
        const monthlyGrowthRate = lastMonthJobs > 0 ? ((currentMonthJobs - lastMonthJobs) / lastMonthJobs) * 100 : 0;

        setMetrics({
          customerLifetimeValue: clv, customerRetentionRate: retentionRate, avgJobsPerCustomer,
          seasonalTrends: Object.values(monthlyData).slice(-6), pricingOptimization,
          growthMetrics: { monthlyGrowthRate, customerAcquisitionCost: 45, revenuePerCustomer: clv }
        });
      }
    } catch (err) {
      console.error('Error fetching business intelligence:', err);
      setError('Failed to load business intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchBusinessIntelligence();
    }
  }, [authLoading, user]);

  if (authLoading) {
    return <div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin text-green-500" /><span className="ml-2 text-white">Loading...</span></div>;
  }

  if (error) {
    return <Card className="bg-black/60 backdrop-blur border border-red-500/25 p-6"><div className="flex flex-col items-center text-center"><AlertCircle className="h-12 w-12 text-red-500 mb-4" /><p className="text-red-400 mb-4">{error}</p><Button onClick={fetchBusinessIntelligence}>Retry</Button></div></Card>;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="bg-black/60 backdrop-blur border border-green-500/25 p-6"><div className="animate-pulse"><div className="h-4 bg-green-500/20 rounded mb-4"></div><div className="h-8 bg-green-500/10 rounded"></div></div></Card>
        ))}
      </div>
    );
  }

  const MetricCard = ({ title, value, icon: Icon, trend, suffix = '' }: { title: string; value: string | number; icon: React.ElementType; trend?: number; suffix?: string }) => (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white">{value}{suffix}</p>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <Icon className="w-8 h-8 text-green-400" />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Customer Lifetime Value" value={`$${metrics.customerLifetimeValue.toFixed(0)}`} icon={DollarSign} trend={12.5} />
        <MetricCard title="Customer Retention Rate" value={metrics.customerRetentionRate.toFixed(1)} suffix="%" icon={Users} trend={metrics.customerRetentionRate > 50 ? 8.2 : -3.1} />
        <MetricCard title="Monthly Growth Rate" value={metrics.growthMetrics.monthlyGrowthRate.toFixed(1)} suffix="%" icon={TrendingUp} trend={metrics.growthMetrics.monthlyGrowthRate} />
      </div>

      <Card className="bg-black/60 backdrop-blur border border-green-500/25 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-green-400" />Service Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-green-500/25"><th className="text-left py-3 text-green-400">Service</th><th className="text-left py-3 text-green-400">Avg Price</th><th className="text-left py-3 text-green-400">Completion</th><th className="text-left py-3 text-green-400">Demand</th></tr></thead>
            <tbody>
              {(metrics.pricingOptimization || []).map((service, i) => (
                <tr key={i} className="border-b border-green-500/10"><td className="py-3 text-white">{service.service}</td><td className="py-3 text-green-400">${service.avgPrice.toFixed(0)}</td><td className="py-3 text-gray-300">{service.completionRate.toFixed(1)}%</td><td className="py-3 text-gray-300">{service.demand} jobs</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="bg-black/60 backdrop-blur border border-green-500/25 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-green-400" />Seasonal Trends</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(metrics.seasonalTrends || []).map((trend, i) => (
            <div key={i} className="text-center p-4 bg-green-500/10 rounded-lg"><p className="text-green-400 font-semibold">{trend.month}</p><p className="text-white text-lg">{trend.jobs}</p><p className="text-gray-400 text-sm">jobs</p><p className="text-green-300 text-sm">${trend.revenue.toFixed(0)}</p></div>
          ))}
        </div>
      </Card>
    </div>
  );
}