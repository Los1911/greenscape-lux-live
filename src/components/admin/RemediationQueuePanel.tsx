import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, Clock, CloudRain, CheckCircle, XCircle, 
  Eye, MessageCircle, DollarSign, User, MapPin, Calendar,
  RefreshCw, Pause, Play, Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FlaggedJobAdmin, RemediationStatus } from '@/types/job';
import TierBadge from '@/components/landscaper/TierBadge';
import { useToast } from '@/hooks/use-toast';

export default function RemediationQueuePanel() {
  const [flaggedJobs, setFlaggedJobs] = useState<FlaggedJobAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<FlaggedJobAdmin | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'extend' | 'resolve' | 'escalate' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [extensionHours, setExtensionHours] = useState('24');
  const [resolutionType, setResolutionType] = useState<string>('completed');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFlaggedJobs();
  }, []);

  const loadFlaggedJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_flagged_jobs_admin')
        .select('*')
        .order('remediation_deadline', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setFlaggedJobs(data || []);
    } catch (err) {
      console.error('Error loading flagged jobs:', err);
      toast({
        title: 'Error',
        description: 'Failed to load flagged jobs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getHoursRemaining = (job: FlaggedJobAdmin): number => {
    if (!job.remediation_deadline) return 48;
    const deadline = new Date(job.remediation_deadline);
    if (job.weather_extension_hours) {
      deadline.setHours(deadline.getHours() + job.weather_extension_hours);
    }
    const diff = deadline.getTime() - Date.now();
    return Math.max(0, diff / (1000 * 60 * 60));
  };

  const getUrgencyBadge = (hoursRemaining: number) => {
    if (hoursRemaining <= 0) {
      return <Badge className="bg-red-900/50 text-red-300 border-red-500/50">Expired</Badge>;
    }
    if (hoursRemaining <= 6) {
      return <Badge className="bg-red-900/40 text-red-300 border-red-500/40 animate-pulse">Critical</Badge>;
    }
    if (hoursRemaining <= 24) {
      return <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/40">Urgent</Badge>;
    }
    return <Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-500/40">Active</Badge>;
  };

  const handleAction = async () => {
    if (!selectedJob || !actionType) return;
    
    setProcessing(true);
    try {
      let updates: Record<string, any> = {};
      let logAction = '';
      
      switch (actionType) {
        case 'extend':
          const newExtension = (selectedJob.weather_extension_hours || 0) + parseInt(extensionHours);
          updates = {
            weather_extension_hours: newExtension,
            remediation_status: 'weather_extended'
          };
          logAction = `Weather extension: +${extensionHours} hours`;
          break;
          
        case 'resolve':
          updates = {
            status: resolutionType === 'completed' ? 'completed' : 'completed',
            remediation_status: resolutionType as RemediationStatus,
            remediation_notes: actionNotes
          };
          logAction = `Resolved: ${resolutionType}`;
          break;
          
        case 'escalate':
          updates = {
            remediation_status: 'escalated',
            remediation_notes: actionNotes
          };
          logAction = 'Escalated for review';
          break;
      }

      // Update job
      const { error: updateError } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', selectedJob.id);

      if (updateError) throw updateError;

      // Log the action
      await supabase.from('remediation_logs').insert({
        job_id: selectedJob.id,
        landscaper_id: selectedJob.landscaper_id,
        action: logAction,
        action_by: 'admin',
        notes: actionNotes,
        weather_reason: actionType === 'extend' ? actionNotes : null
      });

      toast({
        title: 'Action Completed',
        description: `Job ${selectedJob.id.slice(0, 8)} has been updated.`
      });

      setActionModalOpen(false);
      setSelectedJob(null);
      setActionNotes('');
      loadFlaggedJobs();
    } catch (err) {
      console.error('Error processing action:', err);
      toast({
        title: 'Error',
        description: 'Failed to process action',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (job: FlaggedJobAdmin, type: 'extend' | 'resolve' | 'escalate') => {
    setSelectedJob(job);
    setActionType(type);
    setActionNotes('');
    setActionModalOpen(true);
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
          <span className="ml-2 text-slate-300">Loading flagged jobs...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Remediation Queue
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge className="bg-slate-800 text-slate-300 border-slate-600">
                {flaggedJobs.length} Active
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadFlaggedJobs}
                className="border-emerald-500/30 text-emerald-300"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Flagged Jobs List */}
      {flaggedJobs.length === 0 ? (
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Flagged Jobs</h3>
            <p className="text-slate-400">All jobs are in good standing.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {flaggedJobs.map((job) => {
            const hoursRemaining = getHoursRemaining(job);
            
            return (
              <Card key={job.id} className="bg-slate-900 border-slate-700 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Left: Job Info */}
                    <div className="flex-1 p-4 lg:p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white">
                            {job.service_name || job.service_type || 'Landscaping Service'}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">
                            Job #{job.id.slice(0, 8)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getUrgencyBadge(hoursRemaining)}
                          {job.weather_extension_hours && job.weather_extension_hours > 0 && (
                            <Badge className="bg-blue-900/40 text-blue-300 border-blue-500/40">
                              <CloudRain className="h-3 w-3 mr-1" />
                              +{job.weather_extension_hours}h
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <User className="h-4 w-4 text-slate-500" />
                          <span>{job.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          <span className="truncate">{job.service_address || 'No address'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <DollarSign className="h-4 w-4 text-slate-500" />
                          <span>${job.price || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>
                            {job.preferred_date 
                              ? new Date(job.preferred_date).toLocaleDateString() 
                              : 'No date'}
                          </span>
                        </div>
                      </div>

                      {/* Landscaper Info */}
                      <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm text-slate-400">Assigned Landscaper</p>
                          <p className="font-medium text-white">
                            {job.landscaper_first_name} {job.landscaper_last_name}
                          </p>
                          <p className="text-xs text-slate-500">{job.ls_email}</p>
                        </div>
                        {job.landscaper_tier && (
                          <TierBadge tier={job.landscaper_tier} size="sm" />
                        )}
                      </div>

                      {/* Flag Reason */}
                      {job.flagged_reason && (
                        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <p className="text-sm font-medium text-red-300 mb-1">Flag Reason</p>
                          <p className="text-sm text-slate-300">{job.flagged_reason}</p>
                        </div>
                      )}
                    </div>

                    {/* Right: Timer & Actions */}
                    <div className="lg:w-64 p-4 lg:p-6 bg-slate-800/30 border-t lg:border-t-0 lg:border-l border-slate-700 flex flex-col">
                      {/* Timer */}
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Clock className={`h-5 w-5 ${hoursRemaining <= 6 ? 'text-red-400' : 'text-amber-400'}`} />
                          <span className={`text-2xl font-mono font-bold ${
                            hoursRemaining <= 0 ? 'text-red-400' :
                            hoursRemaining <= 6 ? 'text-red-300' :
                            hoursRemaining <= 24 ? 'text-amber-300' : 'text-emerald-300'
                          }`}>
                            {hoursRemaining <= 0 ? 'EXPIRED' : `${Math.floor(hoursRemaining)}h ${Math.floor((hoursRemaining % 1) * 60)}m`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Time Remaining</p>
                      </div>

                      {/* Status */}
                      {job.remediation_status && (
                        <div className="text-center mb-4">
                          <Badge className="bg-slate-700 text-slate-300">
                            {job.remediation_status.replace('_', ' ')}
                          </Badge>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-2 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-900/30"
                          onClick={() => openActionModal(job, 'extend')}
                        >
                          <CloudRain className="h-4 w-4 mr-2" />
                          Weather Extension
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30"
                          onClick={() => openActionModal(job, 'resolve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-amber-500/30 text-amber-300 hover:bg-amber-900/30"
                          onClick={() => openActionModal(job, 'escalate')}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Escalate
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-emerald-300">
              {actionType === 'extend' && 'Weather Extension'}
              {actionType === 'resolve' && 'Resolve Remediation'}
              {actionType === 'escalate' && 'Escalate Issue'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === 'extend' && (
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Extension Hours</label>
                <Select value={extensionHours} onValueChange={setExtensionHours}>
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                    <SelectItem value="72">72 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionType === 'resolve' && (
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Resolution Type</label>
                <Select value={resolutionType} onValueChange={setResolutionType}>
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="completed">Remediation Completed - Full Payment</SelectItem>
                    <SelectItem value="resolved_partial">Partial Resolution - Adjusted Payment</SelectItem>
                    <SelectItem value="resolved_refund">Issue Unresolved - Client Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-slate-300">
                {actionType === 'extend' ? 'Weather Reason' : 'Notes'}
              </label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionType === 'extend' 
                    ? 'Describe weather conditions...' 
                    : 'Add notes about this action...'
                }
                className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModalOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={
                actionType === 'extend' ? 'bg-blue-600 hover:bg-blue-700' :
                actionType === 'resolve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                'bg-amber-600 hover:bg-amber-700'
              }
            >
              {processing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
