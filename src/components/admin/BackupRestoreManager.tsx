import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { RotateCcw, Clock, AlertTriangle, CheckCircle, XCircle, Database, RefreshCw } from 'lucide-react';

interface BackupJob { id: string; backup_name: string; backup_type: string; status: string; file_size_bytes: number; backup_start_time: string; verification_status: string; }
interface RestoreOperation { id: string; backup_job_id: string; restore_type: string; target_timestamp: string; status: string; restore_start_time: string; restore_end_time: string; error_message: string; }

export const BackupRestoreManager: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [restoreOps, setRestoreOps] = useState<RestoreOperation[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [restoreType, setRestoreType] = useState<string>('full');
  const [targetTimestamp, setTargetTimestamp] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const [backupsRes, restoresRes] = await Promise.all([
        supabase.from('backup_jobs').select('*').eq('status', 'completed').eq('verification_status', 'passed').order('created_at', { ascending: false }),
        supabase.from('restore_operations').select('*').order('created_at', { ascending: false }).limit(20)
      ]);
      if (backupsRes.data) setBackupJobs(backupsRes.data);
      if (restoresRes.data) setRestoreOps(restoresRes.data);
    } catch (err) {
      console.error('Failed to load restore data:', err);
      setError('Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user]);

  const initiateRestore = async () => {
    if (!selectedBackup) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('restore_operations').insert({
        backup_job_id: selectedBackup, restore_type: restoreType, target_timestamp: targetTimestamp || null, status: 'pending',
        created_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
      setShowRestoreDialog(false);
      loadData();
    } catch (err) {
      console.error('Failed to initiate restore:', err);
    } finally {
      setLoading(false);
    }
  };


  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === 'running') return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const formatDateTime = (dateString: string) => {
    try { return new Date(dateString).toLocaleString(); } catch { return 'N/A'; }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center p-8"><RefreshCw className="h-8 w-8 animate-spin text-blue-500" /><span className="ml-2">Loading...</span></div>;
  }

  if (error) {
    return <div className="p-6"><Card className="p-6"><div className="flex flex-col items-center text-center"><AlertTriangle className="h-12 w-12 text-red-500 mb-4" /><p className="text-red-500 mb-4">{error}</p><Button onClick={loadData}>Retry</Button></div></Card></div>;
  }

  if (dataLoading) {
    return <div className="p-6">Loading restore manager...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Backup Restore Manager</h1>
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogTrigger asChild><Button><RotateCcw className="h-4 w-4 mr-2" />Initiate Restore</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Restore Database</DialogTitle><DialogDescription>Select a verified backup to restore from.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div><Label>Select Backup</Label>
                <Select value={selectedBackup} onValueChange={setSelectedBackup}><SelectTrigger><SelectValue placeholder="Choose a backup..." /></SelectTrigger>
                  <SelectContent>{backupJobs.map((b) => <SelectItem key={b.id} value={b.id}>{b.backup_name} - {formatDateTime(b.backup_start_time)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Restore Type</Label>
                <Select value={restoreType} onValueChange={setRestoreType}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="full">Full Restore</SelectItem><SelectItem value="partial">Partial Restore</SelectItem><SelectItem value="point_in_time">Point-in-Time</SelectItem></SelectContent>
                </Select>
              </div>
              {restoreType === 'point_in_time' && <div><Label>Target Timestamp</Label><Input type="datetime-local" value={targetTimestamp} onChange={(e) => setTargetTimestamp(e.target.value)} /></div>}
              <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Warning: This will overwrite current database data.</AlertDescription></Alert>
              <div className="flex justify-end space-x-2"><Button variant="outline" onClick={() => setShowRestoreDialog(false)}>Cancel</Button><Button onClick={initiateRestore} disabled={!selectedBackup || loading}>{loading ? 'Initiating...' : 'Start Restore'}</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardHeader><CardTitle>Available Backups</CardTitle><CardDescription>Only verified backups available</CardDescription></CardHeader>
        <CardContent><div className="space-y-3">
          {backupJobs.length === 0 ? <p className="text-gray-500 text-center py-4">No verified backups available</p> : backupJobs.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3"><Database className="h-5 w-5 text-blue-500" /><div><p className="font-medium">{b.backup_name || 'Unnamed'}</p><p className="text-sm text-gray-500">{formatDateTime(b.backup_start_time)} • {b.backup_type}</p></div></div>
              <div className="flex items-center space-x-2"><Badge variant="default">Verified</Badge><Badge variant="outline">{((b.file_size_bytes || 0) / (1024 * 1024)).toFixed(1)} MB</Badge></div>
            </div>
          ))}
        </div></CardContent>
      </Card>

      <Card><CardHeader><CardTitle>Recent Restore Operations</CardTitle><CardDescription>Track restore status</CardDescription></CardHeader>
        <CardContent><div className="space-y-3">
          {restoreOps.length === 0 ? <p className="text-gray-500 text-center py-4">No restore operations</p> : restoreOps.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">{getStatusIcon(r.status)}<div><p className="font-medium">{r.restore_type} restore</p><p className="text-sm text-gray-500">Started: {formatDateTime(r.restore_start_time)}</p>{r.error_message && <p className="text-sm text-red-500">{r.error_message}</p>}</div></div>
              <Badge variant={r.status === 'completed' ? 'default' : r.status === 'failed' ? 'destructive' : 'secondary'}>{r.status}</Badge>
            </div>
          ))}
        </div></CardContent>
      </Card>
    </div>
  );
};