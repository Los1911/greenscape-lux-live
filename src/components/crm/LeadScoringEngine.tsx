import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface ScoringRule {
  id: string;
  name: string;
  category: 'email' | 'website' | 'quote' | 'profile';
  action: string;
  points: number;
  isActive: boolean;
  description: string;
}

interface Lead {
  id: string;
  email: string;
  name: string;
  score: number;
  status: 'cold' | 'warm' | 'hot' | 'qualified';
  lastActivity: string;
  source: string;
  engagementHistory: Array<{
    action: string;
    points: number;
    timestamp: string;
  }>;
}

export const LeadScoringEngine: React.FC = () => {
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([
    { id: '1', name: 'Email Open', category: 'email', action: 'email_open', points: 5, isActive: true, description: 'User opens an email' },
    { id: '2', name: 'Email Click', category: 'email', action: 'email_click', points: 10, isActive: true, description: 'User clicks link in email' },
    { id: '3', name: 'Quote Request', category: 'quote', action: 'quote_request', points: 50, isActive: true, description: 'User submits quote request' },
    { id: '4', name: 'Website Visit', category: 'website', action: 'page_visit', points: 2, isActive: true, description: 'User visits website page' },
    { id: '5', name: 'Profile Complete', category: 'profile', action: 'profile_complete', points: 25, isActive: true, description: 'User completes profile' },
  ]);

  const [leads] = useState<Lead[]>([
    {
      id: '1',
      email: 'john@example.com',
      name: 'John Smith',
      score: 85,
      status: 'hot',
      lastActivity: '2024-01-20',
      source: 'website',
      engagementHistory: [
        { action: 'quote_request', points: 50, timestamp: '2024-01-20' },
        { action: 'email_open', points: 5, timestamp: '2024-01-19' },
        { action: 'page_visit', points: 2, timestamp: '2024-01-18' }
      ]
    }
  ]);

  const [newRule, setNewRule] = useState<Partial<ScoringRule>>({
    name: '',
    category: 'email',
    action: '',
    points: 10,
    isActive: true,
    description: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-500';
      case 'warm': return 'bg-orange-500';
      case 'qualified': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const addScoringRule = () => {
    if (newRule.name && newRule.action) {
      setScoringRules([...scoringRules, {
        ...newRule as ScoringRule,
        id: Date.now().toString()
      }]);
      setNewRule({ name: '', category: 'email', action: '', points: 10, isActive: true, description: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lead Scoring Engine</h2>
        <p className="text-muted-foreground">Configure scoring rules and track lead qualification</p>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList>
          <TabsTrigger value="rules">Scoring Rules</TabsTrigger>
          <TabsTrigger value="leads">Lead Scores</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Scoring Rule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rule Name</Label>
                  <Input
                    value={newRule.name || ''}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., Email Open"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newRule.category} onValueChange={(value: any) => setNewRule({ ...newRule, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="quote">Quote</SelectItem>
                      <SelectItem value="profile">Profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Points: {newRule.points}</Label>
                <Slider
                  value={[newRule.points || 10]}
                  onValueChange={(value) => setNewRule({ ...newRule, points: value[0] })}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
              <Button onClick={addScoringRule}>Add Rule</Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {scoringRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold">{rule.name}</h3>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{rule.category}</Badge>
                    <Badge>{rule.points} pts</Badge>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-4">
            {leads.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{lead.name}</h3>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(lead.status)}>{lead.status.toUpperCase()}</Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{lead.score}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last activity: {new Date(lead.lastActivity).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Scoring Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-sm text-muted-foreground">Total Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">23</div>
                  <div className="text-sm text-muted-foreground">Hot Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">67</div>
                  <div className="text-sm text-muted-foreground">Avg Score</div>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Lead scoring analytics chart would be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};