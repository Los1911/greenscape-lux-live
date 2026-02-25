import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  AlertTriangle, Clock, CheckCircle, Camera, CloudRain,
  Calendar, MapPin, User, FileText, MessageCircle, Send
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Job, RemediationStatus } from '@/types/job';
import RemediationTimer from './RemediationTimer';
import { StructuredJobMessaging } from '@/components/messaging/StructuredJobMessaging';
import { useToast } from '@/hooks/use-toast';

interface RemediationPanelProps {
  job: Job;
  onUpdate?: () => void;
}

export default function RemediationPanel({ job, onUpdate }: RemediationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [weatherReason, setWeatherReason] = useState('');
  const { toast } = useToast();

  const handleAcceptRemediation = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          remediation_status: 'accepted' as RemediationStatus,
          remediation_notes: notes
        })
        .eq('id', job.id);

      if (error) throw error;

      // Log the action
      await supabase.from('remediation_logs').insert({
        job_id: job.id,
        landscaper_id: job.landscaper_id,
        action: 'Remediation accepted',
        action_by: 'landscaper',
        notes
      });

      toast({
        title: 'Remediation Accepted',
        description: 'Please complete the remediation within the deadline.'
      });

      setAcceptModalOpen(false);
      setNotes('');
      onUpdate?.();
    } catch (err) {
      console.error('Error accepting remediation:', err);
      toast({
        title: 'Error',
        description: 'Failed to accept remediation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExtension = async () => {
    if (!weatherReason.trim()) {
      toast({
        title: 'Weather Reason Required',
        description: 'Please describe the weather conditions.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Log the extension request - admin will review
      await supabase.from('remediation_logs').insert({
        job_id: job.id,
        landscaper_id: job.landscaper_id,
        action: 'Weather extension requested',
        action_by: 'landscaper',
        weather_reason: weatherReason,
        notes: 'Pending admin approval'
      });

      toast({
        title: 'Extension Requested',
        description: 'Your weather extension request has been submitted for admin review.'
      });

      setExtensionModalOpen(false);
      setWeatherReason('');
      onUpdate?.();
    } catch (err) {
      console.error('Error requesting extension:', err);
      toast({
        title: 'Error',
        description: 'Failed to request extension',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'completed',
          remediation_status: 'completed' as RemediationStatus
        })
        .eq('id', job.id);

      if (error) throw error;

      // Log the completion
      await supabase.from('remediation_logs').insert({
        job_id: job.id,
        landscaper_id: job.landscaper_id,
        action: 'Remediation completed',
        action_by: 'landscaper'
      });

      toast({
        title: 'Remediation Completed',
        description: 'The job has been marked as remediated. Payment will be released after admin review.'
      });

      onUpdate?.();
    } catch (err) {
      console.error('Error completing remediation:', err);
      toast({
        title: 'Error',
        description: 'Failed to complete remediation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (job.remediation_status) {
      case 'pending_response':
        return <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/40">Awaiting Response</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-900/40 text-blue-300 border-blue-500/40">Accepted</Badge>;
      case 'scheduled':
        return <Badge className="bg-purple-900/40 text-purple-300 border-purple-500/40">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-500/40">In Progress</Badge>;
      case 'weather_extended':
        return <Badge className="bg-blue-900/40 text-blue-300 border-blue-500/40"><CloudRain className="h-3 w-3 mr-1" />Extended</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-500/40">Completed</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300">Pending</Badge>;
    }
  };

  return (
    <Card className="bg-slate-900 border-red-500/30 overflow-hidden">
      {/* Alert Header */}
      <div className="bg-red-900/20 border-b border-red-500/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <span className="font-semibold text-red-300">Remediation Required</span>
          {getStatusBadge()}
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Timer */}
        {job.remediation_deadline && (
          <RemediationTimer
            deadline={job.remediation_deadline}
            weatherExtensionHours={job.weather_extension_hours}
            status={job.remediation_status || undefined}
          />
        )}

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <User className="h-4 w-4 text-slate-500" />
            <span>{job.customer_name}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="truncate">{job.service_address || 'No address'}</span>
          </div>
        </div>

        {/* Flag Reason */}
        {job.flagged_reason && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-sm font-medium text-red-300 mb-1">Issue Reported</p>
            <p className="text-sm text-slate-300">{job.flagged_reason}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-300">
            <strong className="text-white">What to do:</strong> Return to the property and address the reported issue. 
            You have 48 hours from when this was flagged. Weather extensions may be granted by admin if conditions are unsafe.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {(!job.remediation_status || job.remediation_status === 'pending_response') && (
            <Button
              onClick={() => setAcceptModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept & Schedule
            </Button>
          )}

          {(job.remediation_status === 'accepted' || job.remediation_status === 'scheduled' || job.remediation_status === 'in_progress') && (
            <Button
              onClick={handleMarkComplete}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setExtensionModalOpen(true)}
            className="border-blue-500/30 text-blue-300 hover:bg-blue-900/30"
          >
            <CloudRain className="h-4 w-4 mr-2" />
            Weather Extension
          </Button>

          <Button
            variant="outline"
            onClick={() => setMessagingOpen(true)}
            className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30 col-span-2"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message Client
          </Button>
        </div>

        {/* Notes */}
        {job.remediation_notes && (
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Your Notes</p>
            <p className="text-sm text-slate-300">{job.remediation_notes}</p>
          </div>
        )}
      </CardContent>

      {/* Accept Modal */}
      <Dialog open={acceptModalOpen} onOpenChange={setAcceptModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-emerald-300">Accept Remediation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-slate-300">
              By accepting, you commit to returning to the property and addressing the issue within the deadline.
            </p>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about your plan..."
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAcceptModalOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptRemediation}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? 'Processing...' : 'Accept Remediation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extension Modal */}
      <Dialog open={extensionModalOpen} onOpenChange={setExtensionModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-blue-300 flex items-center gap-2">
              <CloudRain className="h-5 w-5" />
              Request Weather Extension
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-slate-300">
              If weather conditions make it unsafe or impossible to complete the work, you can request an extension. 
              Admin will review and approve if conditions warrant.
            </p>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Weather Conditions *</label>
              <Textarea
                value={weatherReason}
                onChange={(e) => setWeatherReason(e.target.value)}
                placeholder="Describe the weather conditions (e.g., heavy rain, flooding, storm warning)..."
                className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExtensionModalOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestExtension}
              disabled={loading || !weatherReason.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messaging Modal */}
      <StructuredJobMessaging
        jobId={job.id}
        jobStatus="flagged_review"
        isOpen={messagingOpen}
        onClose={() => setMessagingOpen(false)}
        jobTitle={job.service_name || 'Remediation'}
      />
    </Card>
  );
}
