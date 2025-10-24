import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function AdminUserCreator() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    masterKey: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Admin user created successfully",
        });
        setFormData({ email: '', password: '', firstName: '', lastName: '', masterKey: '' });
      } else {
        throw new Error(data.error || 'Failed to create admin user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || 'Failed to create admin user',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-black/40 backdrop-blur-md border-green-500/20">
      <CardHeader>
        <CardTitle className="text-green-400">Create Admin User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            className="bg-black/20 border-green-500/30 text-white"
          />
          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            className="bg-black/20 border-green-500/30 text-white"
          />
          <Input
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            required
            className="bg-black/20 border-green-500/30 text-white"
          />
          <Input
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            required
            className="bg-black/20 border-green-500/30 text-white"
          />
          <Input
            type="password"
            placeholder="Master Key"
            value={formData.masterKey}
            onChange={(e) => setFormData({...formData, masterKey: e.target.value})}
            required
            className="bg-black/20 border-green-500/30 text-white"
          />
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Creating...' : 'Create Admin User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}