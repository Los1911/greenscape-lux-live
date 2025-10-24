import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StandardizedButton } from '@/components/ui/standardized-button';
import { User, Phone, MapPin, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProfileEditFormProps {
  initialData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function ProfileEditForm({ initialData, onSave, onCancel }: ProfileEditFormProps) {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    phone: initialData.phone || '',
    address: initialData.address || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          address: formData.address
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onSave(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
          </div>
          <StandardizedButton
            variant="ghost"
            size="sm"
            onClick={onCancel}
            icon={<X className="w-4 h-4" />}
          >
            Cancel
          </StandardizedButton>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm text-gray-300">
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm text-gray-300">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm text-gray-300 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="address" className="text-sm text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Service Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <StandardizedButton
              type="submit"
              variant="primary"
              loading={loading}
              icon={<Save className="w-4 h-4" />}
              className="flex-1"
            >
              Save Changes
            </StandardizedButton>
            <StandardizedButton
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </StandardizedButton>
          </div>
        </form>
      </div>
    </Card>
  );
}