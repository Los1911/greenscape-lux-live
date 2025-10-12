import React, { useState } from 'react';
import { Users, Search, UserCheck, UserX, RotateCcw, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  city?: string;
  signup_date?: string;
}

interface Props {
  clients: User[];
  landscapers: User[];
}

export default function UserManagementCard({ clients, landscapers }: Props) {
  const [activeTab, setActiveTab] = useState<'clients' | 'landscapers'>('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'landscaper'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  const [selectedUser, setSelectedUser] = useState<User & { role: string } | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const { toast } = useToast();

  const allUsers = [
    ...clients.map(u => ({ ...u, role: 'client' as const })),
    ...landscapers.map(u => ({ ...u, role: 'landscaper' as const }))
  ];

  const currentUsers = roleFilter === 'all' 
    ? allUsers 
    : roleFilter === 'client' 
      ? clients.map(u => ({ ...u, role: 'client' as const }))
      : landscapers.map(u => ({ ...u, role: 'landscaper' as const }));
  
  const filteredUsers = currentUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewUser = async (user: User & { role: string }) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleResetPassword = async (user: User & { role: string }) => {
    try {
      const { error } = await supabase.functions.invoke('unified-email', {
        body: {
          type: 'password_reset',
          to: user.email,
          data: {
            user_email: user.email,
            reset_link: `${window.location.origin}/reset-password`
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Password Reset Sent',
        description: `Reset email sent to ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive'
      });
    }
  };

  const handleSuspendUser = async (user: User & { role: string }) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'User Suspended',
        description: `${user.name} has been suspended`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend user',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      suspended: 'bg-red-500/20 text-red-300 border-red-500/30',
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  return (
    <>
      <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_25px_-10px_rgba(34,197,94,0.25)] hover:shadow-[0_0_35px_-5px_rgba(34,197,94,0.35)] transition-all duration-300 col-span-2">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-green-300">User Management</h2>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={() => setActiveTab('clients')}
              className={`flex-1 rounded-full text-xs ${
                activeTab === 'clients' 
                  ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' 
                  : 'bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/20 text-blue-400'
              }`}
            >
              Clients ({clients.length})
            </Button>
            <Button 
              onClick={() => setActiveTab('landscapers')}
              className={`flex-1 rounded-full text-xs ${
                activeTab === 'landscapers' 
                  ? 'bg-purple-600/30 border-purple-500/50 text-purple-300' 
                  : 'bg-purple-600/10 hover:bg-purple-600/20 border-purple-500/20 text-purple-400'
              }`}
            >
              Landscapers ({landscapers.length})
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-black/40 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="text-xs bg-black/40 border border-gray-600 rounded-lg px-2 py-1 text-green-300"
            >
              <option value="all">All Roles</option>
              <option value="client">Clients</option>
              <option value="landscaper">Landscapers</option>
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-black/40 border border-gray-600 rounded-lg px-2 py-1 text-green-300"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
            {filteredUsers.slice(0, 4).map(user => (
              <div key={user.id} className="rounded-xl bg-black/40 border border-gray-700/50 p-3 hover:bg-black/60 hover:border-green-500/30 transition-all duration-200 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-green-300">{user.name}</div>
                    {'role' in user && (
                      <Badge className={`text-xs ${
                        user.role === 'client' 
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}>
                        {user.role}
                      </Badge>
                    )}
                  </div>
                  <Badge className={`text-xs ${getStatusBadge(user.status)}`}>
                    {user.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400">{user.email}</div>
                <div className="text-xs text-gray-500">{user.city || 'Charlotte, NC'}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <Button 
              onClick={() => filteredUsers[0] && handleViewUser(filteredUsers[0])}
              disabled={filteredUsers.length === 0}
              className="rounded-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 text-green-300 text-xs"
            >
              <UserCheck className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button 
              onClick={() => filteredUsers[0] && handleResetPassword(filteredUsers[0])}
              disabled={filteredUsers.length === 0}
              className="rounded-full bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/40 text-yellow-300 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
            <Button 
              onClick={() => filteredUsers[0] && handleSuspendUser(filteredUsers[0])}
              disabled={filteredUsers.length === 0}
              className="rounded-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs"
            >
              <UserX className="w-3 h-3 mr-1" />
              Suspend
            </Button>
          </div>

          <Button className="w-full rounded-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 text-green-300 text-sm hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <Settings className="w-4 h-4 mr-2" />
            Manage All Users
          </Button>
        </div>
      </Card>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-lg">{selectedUser.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p>{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Badge>{selectedUser.role}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Badge className={getStatusBadge(selectedUser.status)}>{selectedUser.status}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <p>{selectedUser.city || 'Charlotte, NC'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
