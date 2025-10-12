import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Zap, Clock, Users, Mail, Plus, Edit, Trash2 } from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  trigger: 'new_subscriber' | 'quote_request' | 'purchase' | 'inactivity' | 'birthday';
  condition?: string;
  delay: number;
  delayUnit: 'minutes' | 'hours' | 'days' | 'weeks';
  template: string;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  totalSent: number;
}

const AutomationRules: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Welcome Series - Day 1',
      trigger: 'new_subscriber',
      delay: 0,
      delayUnit: 'minutes',
      template: 'welcome-email-1',
      isActive: true,
      createdAt: '2024-01-10',
      lastTriggered: '2024-01-18',
      totalSent: 247
    },
    {
      id: '2',
      name: 'Quote Follow-up',
      trigger: 'quote_request',
      delay: 2,
      delayUnit: 'hours',
      template: 'quote-followup',
      isActive: true,
      createdAt: '2024-01-12',
      lastTriggered: '2024-01-17',
      totalSent: 89
    },
    {
      id: '3',
      name: 'Re-engagement Campaign',
      trigger: 'inactivity',
      condition: '30 days no engagement',
      delay: 30,
      delayUnit: 'days',
      template: 'reengagement',
      isActive: false,
      createdAt: '2024-01-08',
      totalSent: 156
    }
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: 'new_subscriber' as const,
    delay: 0,
    delayUnit: 'minutes' as const,
    template: ''
  });

  const getTriggerColor = (trigger: AutomationRule['trigger']) => {
    switch (trigger) {
      case 'new_subscriber': return 'bg-blue-100 text-blue-800';
      case 'quote_request': return 'bg-purple-100 text-purple-800';
      case 'purchase': return 'bg-green-100 text-green-800';
      case 'inactivity': return 'bg-yellow-100 text-yellow-800';
      case 'birthday': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleRuleStatus = (id: string) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === id 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
  };

  const handleCreateRule = () => {
    const rule: AutomationRule = {
      id: Date.now().toString(),
      name: newRule.name,
      trigger: newRule.trigger,
      delay: newRule.delay,
      delayUnit: newRule.delayUnit,
      template: newRule.template,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      totalSent: 0
    };
    
    setRules(prev => [...prev, rule]);
    setNewRule({ name: '', trigger: 'new_subscriber', delay: 0, delayUnit: 'minutes', template: '' });
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Automation Rules</h2>
          <p className="text-muted-foreground">Set up automated email sequences and triggers</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
              <DialogDescription>Set up a new automated email sequence</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  placeholder="Enter rule name..."
                />
              </div>
              <div>
                <Label htmlFor="rule-trigger">Trigger</Label>
                <Select
                  value={newRule.trigger}
                  onValueChange={(value: any) => setNewRule({...newRule, trigger: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_subscriber">New Subscriber</SelectItem>
                    <SelectItem value="quote_request">Quote Request</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="inactivity">Inactivity</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="rule-delay">Delay</Label>
                  <Input
                    id="rule-delay"
                    type="number"
                    value={newRule.delay}
                    onChange={(e) => setNewRule({...newRule, delay: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="rule-delay-unit">Unit</Label>
                  <Select
                    value={newRule.delayUnit}
                    onValueChange={(value: any) => setNewRule({...newRule, delayUnit: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="rule-template">Email Template</Label>
                <Select
                  value={newRule.template}
                  onValueChange={(value) => setNewRule({...newRule, template: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome-email-1">Welcome Email 1</SelectItem>
                    <SelectItem value="quote-followup">Quote Follow-up</SelectItem>
                    <SelectItem value="reengagement">Re-engagement</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateRule} className="w-full">
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{rules.reduce((sum, rule) => sum + rule.totalSent, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.lastTriggered).length}</p>
                <p className="text-sm text-muted-foreground">Recently Triggered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{rule.name}</h3>
                    <Badge className={getTriggerColor(rule.trigger)}>
                      {rule.trigger.replace('_', ' ')}
                    </Badge>
                    {rule.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {rule.delay} {rule.delayUnit}
                        </p>
                        <p className="text-xs text-muted-foreground">Delay</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{rule.totalSent}</p>
                        <p className="text-xs text-muted-foreground">Emails Sent</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{rule.template}</p>
                      <p className="text-xs text-muted-foreground">Template</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {rule.lastTriggered 
                          ? new Date(rule.lastTriggered).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">Last Triggered</p>
                    </div>
                  </div>

                  {rule.condition && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground">
                        Condition: {rule.condition}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRuleStatus(rule.id)}
                  />
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AutomationRules;