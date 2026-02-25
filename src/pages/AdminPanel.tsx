/**
 * LEGACY ADMIN PANEL
 * 
 * Status: DISABLED (via feature flag FEATURE_ADMIN_CONTACT_PANEL)
 * 
 * This page provides:
 * - Contact form submission management
 * - Email template builder
 * 
 * NOT part of GreenScape Lux operational admin system.
 * Kept dormant for potential future CMS functionality.
 * 
 * To re-enable:
 * 1. Set VITE_FEATURE_ADMIN_CONTACT_PANEL=true in environment
 * 2. Ensure 'contacts' table exists in database
 * 3. Test thoroughly before production use
 * 
 * @deprecated Use AdminDashboard for operational admin tasks
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Mail, Phone, MapPin, Calendar, Settings, FileText, RefreshCw } from 'lucide-react';
import EmailTemplateBuilderSimple from '@/components/admin/EmailTemplateBuilderSimple';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  service_type: string;
  message: string;
  created_at: string;
}

/**
 * @deprecated This component is disabled via feature flag
 * Access is controlled by FeatureGatedRoute in App.tsx
 */
export default function AdminPanel() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth and role guard
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/admin-login', { replace: true });
      return;
    }
    
    if (role && role !== 'admin') {
      navigate(role === 'landscaper' ? '/landscaper-dashboard' : '/client-dashboard', { replace: true });
    }
  }, [authLoading, user, role, navigate]);

  useEffect(() => {
    // Only fetch data after auth is resolved and user is admin
    if (authLoading || !user || (role && role !== 'admin')) return;
    fetchContacts();
  }, [authLoading, user, role]);

  const fetchContacts = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setContacts(contacts.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Auth loading guard - prevents white screen on refresh
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Unable to Load Data</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={fetchContacts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Data loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contacts...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage system settings and content</p>
        </div>

        <Tabs defaultValue="contacts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Contact Management</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Email Templates</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-6">
            <div className="grid gap-6">
              {contacts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
                    <p className="text-gray-600">Contact form submissions will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                contacts.map((contact) => (
                  <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {contact.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{contact.service_type}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteContact(contact.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{contact.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{contact.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{contact.address}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(contact.created_at)}</span>
                        </div>
                      </div>
                      {contact.message && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
                          <p className="text-gray-700">{contact.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <EmailTemplateBuilderSimple />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}