import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, DollarSign, User, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

export default function CreateJobModal({ isOpen, onClose, onJobCreated }: Props) {
  const [formData, setFormData] = useState({
    service_name: '',
    client_email: '',
    landscaper_email: '',
    price: '',
    location: '',
    date: '',
    time: '',
    status: 'pending'
  });
  
  const [clients, setClients] = useState<any[]>([]);
  const [landscapers, setLandscapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const services = [
    'Lawn Care', 'Tree Trimming', 'Garden Design', 'Landscaping',
    'Hedge Trimming', 'Mulching', 'Irrigation', 'Seasonal Cleanup'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    // Fetch clients from profiles table
    const { data: clientsData } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .order('first_name');
    
    // Fetch landscapers - need to join with profiles to get email/name
    const { data: landscaperData, error: landscaperError } = await supabase
      .from('landscapers')
      .select('id, user_id, business_name')
      .order('business_name');
    
    if (landscaperError) {
      console.error('Error fetching landscapers:', landscaperError);
    }

    // Get profile data for landscapers
    if (landscaperData && landscaperData.length > 0) {
      const userIds = landscaperData.map(l => l.user_id).filter(Boolean);
      const { data: landscaperProfiles } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .in('user_id', userIds);

      // Map landscaper data with profile info
      const landscapersWithEmail = landscaperData.map(l => {
        const profile = landscaperProfiles?.find(p => p.user_id === l.user_id);
        return {
          email: profile?.email || '',
          name: l.business_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown'
        };
      }).filter(l => l.email); // Only include landscapers with email

      setLandscapers(landscapersWithEmail);
    } else {
      setLandscapers([]);
    }
    
    setClients(clientsData || []);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time into ISO string for preferred_date
      const preferredDateTime = formData.date && formData.time 
        ? new Date(`${formData.date}T${formData.time}`).toISOString()
        : new Date(formData.date).toISOString();

      const { error } = await supabase.from('jobs').insert([{
        service_name: formData.service_name,
        service_type: formData.service_name,
        client_email: formData.client_email,
        landscaper_email: formData.landscaper_email || null,
        price: parseFloat(formData.price),
        service_address: formData.location,
        preferred_date: preferredDateTime,
        status: formData.status,
        customer_name: formData.client_email.split('@')[0],
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      onJobCreated();
      onClose();
      setFormData({
        service_name: '',
        client_email: '',
        landscaper_email: '',
        price: '',
        location: '',
        date: '',
        time: '',
        status: 'pending'
      });
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-black/90 backdrop-blur border border-green-500/30 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_45px_-10px_rgba(34,197,94,0.4)] w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-green-300">Create New Job</h2>
            </div>
            <Button
              onClick={onClose}
              className="rounded-full p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">Service</label>
              <select
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                required
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">Client Email</label>
              <input
                list="clients"
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                required
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="Enter client email"
              />
              <datalist id="clients">
                {clients.map(client => (
                  <option key={client.email} value={client.email} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">Landscaper (Optional)</label>
              <input
                list="landscapers"
                value={formData.landscaper_email}
                onChange={(e) => setFormData({ ...formData, landscaper_email: e.target.value })}
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="Enter landscaper email"
              />
              <datalist id="landscapers">
                {landscapers.map(landscaper => (
                  <option key={landscaper.email} value={landscaper.email} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-300 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-300 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>

                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="Enter job location"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-300 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-300 mb-2">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/40 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 text-green-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                {loading ? 'Creating...' : 'Create Job'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
