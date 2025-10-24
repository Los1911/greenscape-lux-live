import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Target, Calendar, Phone, Mail } from 'lucide-react';
import { LeadScoringEngine } from './LeadScoringEngine';
import { LeadQualificationWorkflow } from './LeadQualificationWorkflow';

interface CRMMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  avgScore: number;
  hotLeads: number;
  followUpsToday: number;
}

interface RecentActivity {
  id: string;
  type: 'email_open' | 'quote_request' | 'page_visit' | 'call_scheduled';
  leadName: string;
  description: string;
  timestamp: string;
  points: number;
}

export const CRMDashboard: React.FC = () => {
  const [metrics] = useState<CRMMetrics>({
    totalLeads: 342,
    qualifiedLeads: 89,
    conversionRate: 26.2,
    avgScore: 67,
    hotLeads: 23,
    followUpsToday: 12
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'quote_request',
      leadName: 'Sarah Johnson',
      description: 'Submitted quote request for landscape design',
      timestamp: '2024-01-20T10:30:00Z',
      points: 50
    },
    {
      id: '2',
      type: 'email_open',
      leadName: 'Mike Chen',
      description: 'Opened "Spring Landscaping Tips" email',
      timestamp: '2024-01-20T09:15:00Z',
      points: 5
    },
    {
      id: '3',
      type: 'page_visit',
      leadName: 'Lisa Rodriguez',
      description: 'Visited pricing page',
      timestamp: '2024-01-20T08:45:00Z',
      points: 10
    },
    {
      id: '4',
      type: 'call_scheduled',
      leadName: 'David Park',
      description: 'Scheduled consultation call',
      timestamp: '2024-01-19T16:20:00Z',
      points: 30
    }
  ]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_open': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'quote_request': return <Target className="h-4 w-4 text-green-500" />;
      case 'page_visit': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'call_scheduled': return <Phone className="h-4 w-4 text-orange-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <p className="text-muted-foreground">Lead scoring, qualification, and sales pipeline management</p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div className="text-sm text-muted-foreground">Total Leads</div>
            </div>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <div className="text-sm text-muted-foreground">Qualified</div>
            </div>
            <div className="text-2xl font-bold">{metrics.qualifiedLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div className="text-sm text-muted-foreground">Conversion</div>
            </div>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </div>
            <div className="text-2xl font-bold">{metrics.avgScore}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="text-sm text-muted-foreground">Hot Leads</div>
            </div>
            <div className="text-2xl font-bold">{metrics.hotLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <div className="text-sm text-muted-foreground">Follow-ups</div>
            </div>
            <div className="text-2xl font-bold">{metrics.followUpsToday}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-2 border rounded">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.leadName}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                    <Badge variant="outline" className="text-xs">+{activity.points} pts</Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Schedule Follow-up Call
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send Email Campaign
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Create Quote
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Import Leads
            </Button>
          </CardContent>
        </Card>

        {/* Lead Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Hot Leads</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/4 h-full bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">23</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Warm Leads</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/2 h-full bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">66</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cold Leads</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-3/4 h-full bg-gray-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">253</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main CRM Tabs */}
      <Tabs defaultValue="scoring" className="w-full">
        <TabsList>
          <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
          <TabsTrigger value="workflow">Qualification Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="scoring">
          <LeadScoringEngine />
        </TabsContent>

        <TabsContent value="workflow">
          <LeadQualificationWorkflow />
        </TabsContent>
      </Tabs>
    </div>
  );
};