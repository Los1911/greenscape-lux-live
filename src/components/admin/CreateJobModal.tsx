import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, DollarSign, User, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
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
    status: 'available',
  });

  const [clients, setClients] = useState<any[]>([]);
  const [landscapers, setLandscapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const services = [
    'Lawn Care',
    'Tree Trimming',
    'Garden Design',
    'Landscaping',
    'Hedge Trimming',
    'Mulching',
    'Irrigation',
    'Seasonal Cleanup'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    const { data: clientsData } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .order('first_name');

    const { data: landscapersData } = await supabase
      .from('landscapers')
      .select('email, name')
      .order('name');

    setClients(clientsData || []);
    setLandscapers(landscapersData || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const preferredDateTime =
        formData.date && formData.time
          ? new Date(`${formData.date}T${formData.time}`).toISOString()
          : null;

      const { error } = await supabase.from('jobs').insert([
        {
          service_type: formData.service_name,
          client_email: formData.client_email,
          landscaper_email: formData.landscaper_email || null,
          price: parseFloat(formData.price) || 0,
          service_address: formData.location,
          preferred_date: preferredDateTime,
          status: formData.status,
          customer_name: formData.client_email.split('@')[0],
          created_at: new Date().toISOString(),
        },
      ]);

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
        status: 'available',
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
      <Card className="bg-black/90 border border-green-500/30 rounded-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-green-300 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Create New Job
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-red-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Service */}
          <div>
            <label className="block text-sm text-green-300 mb-1">Service</label>
            <select
              value={formData.service_name}
              onChange={(e) =>
                setFormData({ ...formData, service_name: e.target.value })
              }
              required
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm text-green-300 mb-1">Client Email</label>
            <input
              list="clients"
              value={formData.client_email}
              onChange={(e) =>
                setFormData({ ...formData, client_email: e.target.value })
              }
              required
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
            <datalist id="clients">
              {clients.map((client) => (
                <option key={client.email} value={client.email} />
              ))}
            </datalist>
          </div>

          {/* Landscaper */}
          <div>
            <label className="block text-sm text-green-300 mb-1">
              Landscaper (Optional)
            </label>
            <input
              list="landscapers"
              value={formData.landscaper_email}
              onChange={(e) =>
                setFormData({ ...formData, landscaper_email: e.target.value })
              }
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
            <datalist id="landscapers">
              {landscapers.map((landscaper) => (
                <option key={landscaper.email} value={landscaper.email} />
              ))}
            </datalist>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm text-green-300 mb-1">Price ($)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-green-300 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="available">Available</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm text-green-300 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              required
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-green-300 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm text-green-300 mb-1">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              required
              className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
