import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StandardizedButton } from '@/components/ui/standardized-button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: number;
    service_name?: string;
    date?: string;
  };
  onReschedule: () => void;
}

export default function RescheduleModal({ isOpen, onClose, job, onReschedule }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const newDateTime = `${selectedDate.toISOString().split('T')[0]} ${selectedTime}`;
      
      const { error } = await supabase
        .from('jobs')
        .update({ 
          date: newDateTime,
          status: 'rescheduled'
        })
        .eq('id', job.id);

      if (error) throw error;

      onReschedule();
      onClose();
    } catch (error) {
      console.error('Error rescheduling job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border border-green-500/25 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-300 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Reschedule Job
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-gray-300">Service: {job.service_name}</Label>
          </div>
          
          <div>
            <Label className="text-gray-300 mb-2 block">Select New Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border border-green-500/25"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Time
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="bg-black/50 border-green-500/25">
                <SelectValue placeholder="Choose time slot" />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/25">
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time} className="text-white hover:bg-green-500/20">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <StandardizedButton 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
            >
              Cancel
            </StandardizedButton>
            <StandardizedButton 
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime || loading}
              variant="primary"
              className="flex-1"
            >
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </StandardizedButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}