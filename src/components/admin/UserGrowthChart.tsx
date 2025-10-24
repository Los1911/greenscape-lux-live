import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Users, UserPlus } from 'lucide-react';

interface UserGrowthChartProps {
  filters: {
    dateRange: string;
    serviceType: string;
    location: string;
  };
}

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ filters }) => {
  const { data, loading } = useAnalyticsData(filters);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userGrowthData = data?.userGrowthData || [];
  const totalClients = userGrowthData.reduce((sum, item) => sum + item.clients, 0);
  const totalLandscapers = userGrowthData.reduce((sum, item) => sum + item.landscapers, 0);
  const totalUsers = totalClients + totalLandscapers;

  // Cumulative growth data
  const cumulativeData = userGrowthData.reduce((acc, item, index) => {
    const prevClients = index > 0 ? acc[index - 1].cumulativeClients : 0;
    const prevLandscapers = index > 0 ? acc[index - 1].cumulativeLandscapers : 0;
    
    acc.push({
      ...item,
      cumulativeClients: prevClients + item.clients,
      cumulativeLandscapers: prevLandscapers + item.landscapers
    });
    return acc;
  }, [] as any[]);

  // User distribution pie chart data
  const distributionData = [
    { name: 'Clients', value: totalClients, color: '#8884d8' },
    { name: 'Landscapers', value: totalLandscapers, color: '#82ca9d' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            User Growth Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalClients}</div>
              <div className="text-sm text-muted-foreground">New Clients</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalLandscapers}</div>
              <div className="text-sm text-muted-foreground">New Landscapers</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="cumulativeClients" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Clients"
              />
              <Line 
                type="monotone" 
                dataKey="cumulativeLandscapers" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Landscapers"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm">Clients</span>
              </div>
              <span className="text-sm font-medium">{totalClients}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm">Landscapers</span>
              </div>
              <span className="text-sm font-medium">{totalLandscapers}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};