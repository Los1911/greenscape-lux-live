import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Play, Pause, Edit, Trash2, Plus, Users, Mail } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: 'drip' | 'one-time' | 'recurring';
  status: 'active' | 'paused' | 'draft' | 'completed';
  subscribers: number;
  sent: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  nextSend?: string;
}

const CampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Welcome Series',
      type: 'drip',
      status: 'active',
      subscribers: 1247,
      sent: 3421,
      openRate: 28.5,
      clickRate: 4.2,
      createdAt: '2024-01-10',
      nextSend: '2024-01-20'
    },
    {
      id: '2',
      name: 'Spring Cleanup Promo',
      type: 'one-time',
      status: 'completed',
      subscribers: 2847,
      sent: 2847,
      openRate: 22.1,
      clickRate: 3.8,
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Monthly Newsletter',
      type: 'recurring',
      status: 'active',
      subscribers: 2654,
      sent: 7962,
      openRate: 19.7,
      clickRate: 2.9,
      createdAt: '2024-01-01',
      nextSend: '2024-02-01'
    }
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'one-time' as const,
    template: '',
    audience: 'all'
  });

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Campaign['type']) => {
    switch (type) {
      case 'drip': return 'bg-purple-100 text-purple-800';
      case 'one-time': return 'bg-orange-100 text-orange-800';
      case 'recurring': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateCampaign = () => {
    const campaign: Campaign = {
      id: Date.now().toString(),
      name: newCampaign.name,
      type: newCampaign.type,
      status: 'draft',
      subscribers: 0,
      sent: 0,
      openRate: 0,
      clickRate: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setCampaigns(prev => [...prev, campaign]);
    setNewCampaign({ name: '', type: 'one-time', template: '', audience: 'all' });
    setIsCreateModalOpen(false);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => 
      prev.map(campaign => 
        campaign.id === id 
          ? { ...campaign, status: campaign.status === 'active' ? 'paused' : 'active' }
          : campaign
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Campaign Manager</h2>
          <p className="text-muted-foreground">Create and manage email campaigns</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>Set up a new email campaign</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  placeholder="Enter campaign name..."
                />
              </div>
              <div>
                <Label htmlFor="campaign-type">Campaign Type</Label>
                <Select
                  value={newCampaign.type}
                  onValueChange={(value: any) => setNewCampaign({...newCampaign, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time Send</SelectItem>
                    <SelectItem value="drip">Drip Campaign</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="campaign-audience">Target Audience</Label>
                <Select
                  value={newCampaign.audience}
                  onValueChange={(value) => setNewCampaign({...newCampaign, audience: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subscribers</SelectItem>
                    <SelectItem value="new-leads">New Leads</SelectItem>
                    <SelectItem value="quote-requests">Quote Requests</SelectItem>
                    <SelectItem value="customers">Existing Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateCampaign} className="w-full">
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {campaigns.map(campaign => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    <Badge className={getTypeColor(campaign.type)}>
                      {campaign.type}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{campaign.subscribers.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Subscribers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{campaign.sent.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Sent</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{campaign.openRate}%</p>
                      <p className="text-xs text-muted-foreground">Open Rate</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{campaign.clickRate}%</p>
                      <p className="text-xs text-muted-foreground">Click Rate</p>
                    </div>
                  </div>

                  {campaign.nextSend && (
                    <div className="flex items-center gap-2 mt-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Next send: {new Date(campaign.nextSend).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCampaignStatus(campaign.id)}
                    disabled={campaign.status === 'completed'}
                  >
                    {campaign.status === 'active' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
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

export default CampaignManager;