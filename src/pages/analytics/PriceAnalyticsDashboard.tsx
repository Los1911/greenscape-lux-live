import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, DollarSign, Target, MapPin, ArrowLeft, LogOut } from 'lucide-react';

interface PricingData {
  id: string;
  quote_request_id: string;
  estimated_min: number;
  estimated_max: number;
  final_bid?: number;
  accepted: boolean;
  service_type: string;
  region?: string;
  created_at: string;
}

const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'];

export default function PriceAnalyticsDashboard() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [data, setData] = useState<PricingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // Role guard: redirect if user is not an admin
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/admin-login', { replace: true });
      return;
    }
    
    // Redirect wrong roles to their correct dashboard
    if (role === 'client') {
      navigate('/client-dashboard', { replace: true });
      return;
    }
    if (role === 'landscaper') {
      navigate('/landscaper-dashboard', { replace: true });
      return;
    }
  }, [authLoading, user, role, navigate]);

  useEffect(() => {
    if (authLoading || role !== 'admin') return;
    fetchPricingData();
  }, [dateRange, serviceFilter, regionFilter, authLoading, role]);

  const fetchPricingData = async () => {
    console.log('[ANALYTICS] Fetching pricing data', { dateRange, serviceFilter, regionFilter });
    setLoading(true);
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      let query = supabase
        .from('pricing_history')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (serviceFilter !== 'all') {
        query = query.eq('service_type', serviceFilter);
      }
      if (regionFilter !== 'all') {
        query = query.eq('region', regionFilter);
      }

      const { data: result, error } = await query;

      if (error) throw error;
      
      console.log('[ANALYTICS] Fetched records:', result?.length || 0);
      setData(result || []);
    } catch (error) {
      console.error('[ANALYTICS] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin-login', { replace: true });
  };

  const winRateData = () => {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      if (!acc[date]) acc[date] = { date, total: 0, won: 0 };
      acc[date].total++;
      if (item.accepted) acc[date].won++;
      return acc;
    }, {} as Record<string, { date: string; total: number; won: number }>);

    return Object.values(grouped).map(g => ({
      date: g.date,
      winRate: ((g.won / g.total) * 100).toFixed(1)
    }));
  };

  const avgPriceData = () => {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      if (!acc[date]) acc[date] = { date, estimates: [], bids: [] };
      acc[date].estimates.push((item.estimated_min + item.estimated_max) / 2);
      if (item.final_bid) acc[date].bids.push(item.final_bid);
      return acc;
    }, {} as Record<string, { date: string; estimates: number[]; bids: number[] }>);

    return Object.values(grouped).map(g => ({
      date: g.date,
      avgEstimate: g.estimates.reduce((a, b) => a + b, 0) / g.estimates.length,
      avgBid: g.bids.length ? g.bids.reduce((a, b) => a + b, 0) / g.bids.length : 0
    }));
  };

  const serviceDistribution = () => {
    const services = data.reduce((acc, item) => {
      acc[item.service_type] = (acc[item.service_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(services).map(([name, value]) => ({ name, value }));
  };

  const regionalPricing = () => {
    const regions = data.reduce((acc, item) => {
      const region = item.region || 'Unknown';
      if (!acc[region]) acc[region] = { region, total: 0, count: 0 };
      acc[region].total += (item.estimated_min + item.estimated_max) / 2;
      acc[region].count++;
      return acc;
    }, {} as Record<string, { region: string; total: number; count: number }>);

    return Object.values(regions).map(r => ({
      region: r.region,
      avgPrice: Math.round(r.total / r.count)
    }));
  };

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black text-white flex items-center justify-center">
        <div className="text-emerald-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Admin Header - Matches AdminDashboard */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/admin-dashboard')} 
              variant="outline" 
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-emerald-300">Price Analytics</h1>
              <p className="text-emerald-300/70">AI-powered pricing insights and trends</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 p-6">
          <div className="flex gap-4 flex-wrap">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-black/40 border-emerald-500/30 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-emerald-500/30">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-48 bg-black/40 border-emerald-500/30 text-white">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent className="bg-black border-emerald-500/30">
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="lawn_mowing">Lawn Mowing</SelectItem>
                <SelectItem value="landscaping">Landscaping</SelectItem>
                <SelectItem value="tree_trimming">Tree Trimming</SelectItem>
              </SelectContent>
            </Select>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-48 bg-black/40 border-emerald-500/30 text-white">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent className="bg-black border-emerald-500/30">
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={fetchPricingData} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Refresh Data
            </Button>
          </div>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Win Rate Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={winRateData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2f" />
                <XAxis dataKey="date" stroke="#6ee7b7" />
                <YAxis stroke="#6ee7b7" />
                <Tooltip contentStyle={{ backgroundColor: '#0a0f0c', border: '1px solid #10b981', color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="winRate" stroke="#10b981" strokeWidth={2} name="Win Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Average Pricing
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={avgPriceData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2f" />
                <XAxis dataKey="date" stroke="#6ee7b7" />
                <YAxis stroke="#6ee7b7" />
                <Tooltip contentStyle={{ backgroundColor: '#0a0f0c', border: '1px solid #10b981', color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="avgEstimate" stroke="#10b981" strokeWidth={2} name="Avg Estimate" />
                <Line type="monotone" dataKey="avgBid" stroke="#3b82f6" strokeWidth={2} name="Avg Bid" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Service Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={serviceDistribution()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {serviceDistribution().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0a0f0c', border: '1px solid #10b981', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Regional Pricing
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalPricing()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2f" />
                <XAxis dataKey="region" stroke="#6ee7b7" />
                <YAxis stroke="#6ee7b7" />
                <Tooltip contentStyle={{ backgroundColor: '#0a0f0c', border: '1px solid #10b981', color: '#fff' }} />
                <Bar dataKey="avgPrice" fill="#10b981" name="Avg Price ($)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {loading && (
          <div className="text-center text-emerald-400 py-8">
            Loading analytics data...
          </div>
        )}

        {!loading && data.length === 0 && (
          <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 p-8 text-center">
            <TrendingUp className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Pricing Data Available</h3>
            <p className="text-emerald-300/70">
              Pricing analytics will appear here once quote data is collected.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
