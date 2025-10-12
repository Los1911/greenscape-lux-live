import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StandardizedButton } from '@/components/ui/standardized-button';
import { Calendar, MapPin, User, DollarSign, FileText, Phone, Mail } from 'lucide-react';
import { Job } from '@/types/job';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

export default function JobDetailsModal({ isOpen, onClose, job }: JobDetailsModalProps) {
  if (!job) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'cancelled':
        return 'bg-red-900/30 text-red-400 border-red-500/30';
      case 'rescheduled':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
      });
    } catch { return dateString; }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border border-green-500/25 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-green-300 flex items-center justify-between">
            <span>{job.service_name || 'Landscaping Service'}</span>
            <Badge className={`${getStatusColor(job.status)} border`}>
              {job.status || 'pending'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm">Scheduled Date</p>
                  <p className="text-white">{formatDate(job.preferred_date)}</p>
                </div>
              </div>
              {job.service_address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Location</p>
                    <p className="text-white">{job.service_address}</p>
                  </div>
                </div>
              )}
              {job.price && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Cost</p>
                    <p className="text-white text-lg font-semibold">${job.price}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-green-500/20">
            <StandardizedButton onClick={onClose} variant="outline" className="flex-1">
              Close
            </StandardizedButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}