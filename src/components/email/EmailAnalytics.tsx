import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Mail, MousePointer, Users, DollarSign } from 'lucide-react';

interface AnalyticsData {
  period: string;
  emailsSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  conversions: number;
  revenue: number;
}

const EmailAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  
  const analyticsData: AnalyticsData = {
    period: selectedPeriod,
    emailsSent: 15420,
    delivered: 14987,
    opened: 3642,
    clicked: 586,
    unsubscribed: 23,
    bounced: 433,
    conversions: 124,
    revenue: 18750
  };

  const deliveryRate = (analyticsData.delivered / analyticsData.emailsSent) * 100;
  const openRate = (analyticsData.opened / analyticsData.delivered) * 100;
  const clickRate = (analyticsData.clicked / analyticsData.opened) * 100;
  const conversionRate = (analyticsData.conversions / analyticsData.clicked) * 100;
  const unsubscribeRate = (analyticsData.unsubscribed / analyticsData.delivered) * 100;
  const bounceRate = (analyticsData.bounced / analyticsData.emailsSent) * 100;

  const topCampaigns = [
    { name: 'Spring Cleanup Promo', sent: 2847, openRate: 28.5, clickRate: 4.2, conversions: 45 },
    { name: 'Welcome Series', sent: 1247, openRate: 32.1, clickRate: 5.8, conversions: 28 },
    { name: 'Monthly Newsletter', sent: 2654, openRate: 19.7, clickRate: 2.9, conversions: 18 },
    { name: 'Seasonal Services', sent: 1892, openRate: 25.3, clickRate: 3.7, conversions: 22 }
  ];

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    percentage: number;
    trend: 'up' | 'down';
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, percentage, trend, icon, color }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {percentage.toFixed(1)}%
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Analytics</h2>
          <p className="text-muted-foreground">Track email performance and engagement metrics</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Emails Sent"
          value={analyticsData.emailsSent}
          percentage={12.5}
          trend="up"
          icon={<Mail className="w-5 h-5 text-blue-600" />}
          color="bg-blue-100"
        />
        <MetricCard
          title="Open Rate"
          value={`${openRate.toFixed(1)}%`}
          percentage={2.3}
          trend="up"
          icon={<Users className="w-5 h-5 text-green-600" />}
          color="bg-green-100"
        />
        <MetricCard
          title="Click Rate"
          value={`${clickRate.toFixed(1)}%`}
          percentage={1.8}
          trend="up"
          icon={<MousePointer className="w-5 h-5 text-purple-600" />}
          color="bg-purple-100"
        />
        <MetricCard
          title="Revenue"
          value={`$${analyticsData.revenue.toLocaleString()}`}
          percentage={8.7}
          trend="up"
          icon={<DollarSign className="w-5 h-5 text-orange-600" />}
          color="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key email performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Delivery Rate</span>
                <span className="font-medium">{deliveryRate.toFixed(1)}%</span>
              </div>
              <Progress value={deliveryRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Open Rate</span>
                <span className="font-medium">{openRate.toFixed(1)}%</span>
              </div>
              <Progress value={openRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Click-through Rate</span>
                <span className="font-medium">{clickRate.toFixed(1)}%</span>
              </div>
              <Progress value={clickRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversion Rate</span>
                <span className="font-medium">{conversionRate.toFixed(1)}%</span>
              </div>
              <Progress value={conversionRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Unsubscribe Rate</span>
                <span className="font-medium text-red-600">{unsubscribeRate.toFixed(2)}%</span>
              </div>
              <Progress value={unsubscribeRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bounce Rate</span>
                <span className="font-medium text-yellow-600">{bounceRate.toFixed(1)}%</span>
              </div>
              <Progress value={bounceRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Campaigns</CardTitle>
            <CardDescription>Best campaigns by engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCampaigns.map((campaign, index) => (
                <div key={campaign.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{campaign.name}</p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Sent: {campaign.sent.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Opens: {campaign.openRate}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Clicks: {campaign.clickRate}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {campaign.conversions} conversions
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Engagement Timeline</CardTitle>
          <CardDescription>Email engagement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Interactive engagement chart would be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAnalytics;