import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, UserPlus, Mail, Phone, MapPin } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  source: 'website' | 'quote-form' | 'referral' | 'import';
  subscribedAt: string;
  lastEngagement?: string;
  tags: string[];
}

const SubscriberManager: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([
    {
      id: '1',
      email: 'john.doe@email.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1 (555) 123-4567',
      location: 'Beverly Hills, CA',
      status: 'active',
      source: 'quote-form',
      subscribedAt: '2024-01-15',
      lastEngagement: '2024-01-18',
      tags: ['high-value', 'residential']
    },
    {
      id: '2',
      email: 'sarah.smith@email.com',
      firstName: 'Sarah',
      lastName: 'Smith',
      location: 'Malibu, CA',
      status: 'active',
      source: 'website',
      subscribedAt: '2024-01-12',
      lastEngagement: '2024-01-17',
      tags: ['commercial', 'new-lead']
    },
    {
      id: '3',
      email: 'mike.johnson@email.com',
      firstName: 'Mike',
      lastName: 'Johnson',
      phone: '+1 (555) 987-6543',
      location: 'Santa Monica, CA',
      status: 'unsubscribed',
      source: 'referral',
      subscribedAt: '2024-01-08',
      tags: ['residential']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = 
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${subscriber.firstName} ${subscriber.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || subscriber.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusColor = (status: Subscriber['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'unsubscribed': return 'bg-red-100 text-red-800';
      case 'bounced': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: Subscriber['source']) => {
    switch (source) {
      case 'website': return 'bg-blue-100 text-blue-800';
      case 'quote-form': return 'bg-purple-100 text-purple-800';
      case 'referral': return 'bg-orange-100 text-orange-800';
      case 'import': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportSubscribers = () => {
    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Phone', 'Location', 'Status', 'Source', 'Subscribed At', 'Tags'],
      ...filteredSubscribers.map(sub => [
        sub.email,
        sub.firstName,
        sub.lastName,
        sub.phone || '',
        sub.location || '',
        sub.status,
        sub.source,
        sub.subscribedAt,
        sub.tags.join('; ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Subscriber Management</h2>
          <p className="text-muted-foreground">Manage your email subscribers and segments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSubscribers}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Subscriber
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{subscribers.filter(s => s.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{subscribers.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{subscribers.filter(s => s.phone).length}</p>
                <p className="text-sm text-muted-foreground">With Phone</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{subscribers.filter(s => s.location).length}</p>
                <p className="text-sm text-muted-foreground">With Location</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Subscribers</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscribers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="quote-form">Quote Form</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscriber</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.map(subscriber => (
                <TableRow key={subscriber.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{subscriber.firstName} {subscriber.lastName}</p>
                      <p className="text-sm text-muted-foreground">{subscriber.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {subscriber.phone && <p>{subscriber.phone}</p>}
                      {subscriber.location && <p className="text-muted-foreground">{subscriber.location}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(subscriber.status)}>
                      {subscriber.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSourceColor(subscriber.source)}>
                      {subscriber.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(subscriber.subscribedAt).toLocaleDateString()}</p>
                      {subscriber.lastEngagement && (
                        <p className="text-muted-foreground">
                          Last: {new Date(subscriber.lastEngagement).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {subscriber.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriberManager;