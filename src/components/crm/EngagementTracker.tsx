import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, MousePointer, Mail, Phone, Calendar, TrendingUp } from 'lucide-react';

interface EngagementEvent {
  id: string;
  leadId: string;
  leadName: string;
  type: 'email_open' | 'email_click' | 'page_visit' | 'quote_request' | 'call_scheduled' | 'form_submit';
  description: string;
  timestamp: string;
  points: number;
  metadata?: {
    emailSubject?: string;
    pageUrl?: string;
    clickedLink?: string;
    formType?: string;
  };
}

interface EngagementSummary {
  leadId: string;
  leadName: string;
  email: string;
  totalEvents: number;
  totalPoints: number;
  lastActivity: string;
  engagementScore: number;
  topActivities: string[];
}

export const EngagementTracker: React.FC = () => {
  const [engagementEvents] = useState<EngagementEvent[]>([
    {
      id: '1',
      leadId: 'lead1',
      leadName: 'Sarah Johnson',
      type: 'email_open',
      description: 'Opened "Spring Landscaping Tips" email',
      timestamp: '2024-01-20T10:30:00Z',
      points: 5,
      metadata: { emailSubject: 'Spring Landscaping Tips' }
    },
    {
      id: '2',
      leadId: 'lead1',
      leadName: 'Sarah Johnson',
      type: 'email_click',
      description: 'Clicked "Get Quote" button in email',
      timestamp: '2024-01-20T10:32:00Z',
      points: 10,
      metadata: { clickedLink: 'Get Quote Button' }
    },
    {
      id: '3',
      leadId: 'lead1',
      leadName: 'Sarah Johnson',
      type: 'quote_request',
      description: 'Submitted landscape design quote request',
      timestamp: '2024-01-20T10:35:00Z',
      points: 50
    },
    {
      id: '4',
      leadId: 'lead2',
      leadName: 'Mike Chen',
      type: 'page_visit',
      description: 'Visited pricing page',
      timestamp: '2024-01-20T09:15:00Z',
      points: 2,
      metadata: { pageUrl: '/pricing' }
    },
    {
      id: '5',
      leadId: 'lead2',
      leadName: 'Mike Chen',
      type: 'page_visit',
      description: 'Visited services page',
      timestamp: '2024-01-20T09:18:00Z',
      points: 2,
      metadata: { pageUrl: '/services' }
    }
  ]);

  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedEventType, setSelectedEventType] = useState('all');

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'email_open': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'email_click': return <MousePointer className="h-4 w-4 text-green-500" />;
      case 'page_visit': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'quote_request': return <Mail className="h-4 w-4 text-orange-500" />;
      case 'call_scheduled': return <Phone className="h-4 w-4 text-red-500" />;
      case 'form_submit': return <Calendar className="h-4 w-4 text-indigo-500" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'email_open': return 'Email Open';
      case 'email_click': return 'Email Click';
      case 'page_visit': return 'Page Visit';
      case 'quote_request': return 'Quote Request';
      case 'call_scheduled': return 'Call Scheduled';
      case 'form_submit': return 'Form Submit';
      default: return type;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const generateEngagementSummary = (): EngagementSummary[] => {
    const leadGroups = engagementEvents.reduce((acc, event) => {
      if (!acc[event.leadId]) {
        acc[event.leadId] = {
          leadId: event.leadId,
          leadName: event.leadName,
          email: `${event.leadName.toLowerCase().replace(' ', '.')}@example.com`,
          events: [],
          totalPoints: 0
        };
      }
      acc[event.leadId].events.push(event);
      acc[event.leadId].totalPoints += event.points;
      return acc;
    }, {} as any);

    return Object.values(leadGroups).map((group: any) => ({
      leadId: group.leadId,
      leadName: group.leadName,
      email: group.email,
      totalEvents: group.events.length,
      totalPoints: group.totalPoints,
      lastActivity: group.events.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0].timestamp,
      engagementScore: Math.min(100, Math.round(group.totalPoints * 1.2)),
      topActivities: [...new Set(group.events.map((e: any) => getEventTypeLabel(e.type)))]
    }));
  };

  const filteredEvents = engagementEvents.filter(event => {
    if (selectedEventType !== 'all' && event.type !== selectedEventType) return false;
    
    const eventDate = new Date(event.timestamp);
    const now = new Date();
    const daysAgo = parseInt(selectedTimeframe.replace('d', ''));
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    return eventDate >= cutoffDate;
  });

  const engagementSummary = generateEngagementSummary();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Engagement Tracker</h2>
        <p className="text-muted-foreground">Monitor lead engagement across all touchpoints</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedEventType} onValueChange={setSelectedEventType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="email_open">Email Opens</SelectItem>
            <SelectItem value="email_click">Email Clicks</SelectItem>
            <SelectItem value="page_visit">Page Visits</SelectItem>
            <SelectItem value="quote_request">Quote Requests</SelectItem>
            <SelectItem value="call_scheduled">Calls Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Engagement Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {engagementSummary.map((summary) => (
              <div key={summary.leadId} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{summary.leadName}</h4>
                    <p className="text-sm text-muted-foreground">{summary.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{summary.engagementScore}</div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-2">
                    {summary.topActivities.slice(0, 2).map((activity) => (
                      <Badge key={activity} variant="outline" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-muted-foreground">
                    {summary.totalEvents} events • {formatTimeAgo(summary.lastActivity)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Engagement Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredEvents.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-2 border rounded">
                {getEventIcon(event.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{event.leadName}</p>
                    <Badge variant="outline" className="text-xs">+{event.points} pts</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                  {event.metadata && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.metadata.emailSubject && `Email: ${event.metadata.emailSubject}`}
                      {event.metadata.pageUrl && `Page: ${event.metadata.pageUrl}`}
                      {event.metadata.clickedLink && `Link: ${event.metadata.clickedLink}`}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(event.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <div className="text-sm text-muted-foreground">Email Opens</div>
            </div>
            <div className="text-2xl font-bold">
              {filteredEvents.filter(e => e.type === 'email_open').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-green-500" />
              <div className="text-sm text-muted-foreground">Email Clicks</div>
            </div>
            <div className="text-2xl font-bold">
              {filteredEvents.filter(e => e.type === 'email_click').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div className="text-sm text-muted-foreground">Page Visits</div>
            </div>
            <div className="text-2xl font-bold">
              {filteredEvents.filter(e => e.type === 'page_visit').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-orange-500" />
              <div className="text-sm text-muted-foreground">Quote Requests</div>
            </div>
            <div className="text-2xl font-bold">
              {filteredEvents.filter(e => e.type === 'quote_request').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};