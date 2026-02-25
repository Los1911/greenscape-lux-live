import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';

interface ScheduleServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleServiceModal: React.FC<ScheduleServiceModalProps> = ({ isOpen, onClose }) => {
  const [serviceType, setServiceType] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceType || !startDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('quote_requests')
        .insert({
          user_id: user.id,
          service_type: serviceType,
          description: notes || `Recurring ${frequency} ${serviceType}`,
          recurring: true,
          recurring_frequency: frequency,
          preferred_start_date: startDate,
          status: 'pending'
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setServiceType('');
        setFrequency('weekly');
        setStartDate('');
        setNotes('');
        setSuccess(false);
        setError('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to schedule service');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form state
      setServiceType('');
      setFrequency('weekly');
      setStartDate('');
      setNotes('');
      setSuccess(false);
      setError('');
    }
  };

  const renderFooter = () => (
    <div className="flex gap-3">
      <Button 
        type="button" 
        onClick={handleClose} 
        disabled={loading} 
        variant="secondary"
        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        form="schedule-form"
        disabled={loading || success}
        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Clock className="w-4 h-4 mr-2" />
        {loading ? 'Scheduling...' : success ? 'Scheduled!' : 'Schedule'}
      </Button>
    </div>
  );

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Schedule Recurring Service"
      subtitle="Set up automatic service scheduling"
      icon={<Calendar className="w-5 h-5" />}
      footer={renderFooter()}
      height="auto"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/25 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-400">Service scheduled successfully!</p>
        </div>
      )}

      <form id="schedule-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField 
          name="serviceType" 
          label="Service Type" 
          value={serviceType}
          onChange={setServiceType} 
          placeholder="e.g., Lawn Mowing, Hedge Trimming" 
          required
          className="bg-gray-800 border-gray-700 text-white" 
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
          <select 
            value={frequency} 
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <FormField 
          name="startDate" 
          label="Start Date" 
          type="date" 
          value={startDate}
          onChange={setStartDate} 
          required 
          className="bg-gray-800 border-gray-700 text-white" 
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Notes (optional)</label>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            rows={3} 
          />
        </div>
      </form>
    </MobileBottomSheet>
  );
};
