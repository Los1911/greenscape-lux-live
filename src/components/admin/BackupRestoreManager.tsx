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
import { 
  RotateCcw, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database
} from 'lucide-react';

interface BackupJob {
  id: string;
  backup_name: string;
  backup_type: string;
  status: string;
  file_size_bytes: number;
  backup_start_time: string;
  verification_status: string;
}

interface RestoreOperation {
  id: string;
  backup_job_id: string;
  restore_type: string;
  target_timestamp: string;
  status: string;
  restore_start_time: string;
  restore_end_time: string;
  error_message: string;
}

export const BackupRestoreManager: React.FC = () => {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [restoreOps, setRestoreOps] = useState<RestoreOperation[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [restoreType, setRestoreType] = useState<string>('full');
  const [targetTimestamp, setTargetTimestamp] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [backupsResponse, restoresResponse] = await Promise.all([
        supabase
          .from('backup_jobs')
          .select('*')
          .eq('status', 'completed')
          .eq('verification_status', 'passed')
          .order('created_at', { ascending: false }),
        supabase
          .from('restore_operations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      if (backupsResponse.data) setBackupJobs(backupsResponse.data);
      if (restoresResponse.data) setRestoreOps(restoresResponse.data);
    } catch (error) {
      console.error('Failed to load restore data:', error);
    }
  };

  const initiateRestore = async () => {
    if (!selectedBackup) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restore_operations')
        .insert({
          backup_job_id: selectedBackup,
          restore_type: restoreType,
          target_timestamp: targetTimestamp || null,
          status: 'pending',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // In production, this would trigger the actual restore process
      await simulateRestoreProcess(data.id);
      
      setShowRestoreDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to initiate restore:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateRestoreProcess = async (restoreId: string) => {
    // Update status to running
    await supabase
      .from('restore_operations')
      .update({ 
        status: 'running',
        restore_start_time: new Date().toISOString()
      })
      .eq('id', restoreId);

    // Simulate restore process
    setTimeout(async () => {
      const success = Math.random() > 0.2; // 80% success rate
      
      await supabase
        .from('restore_operations')
        .update({
          status: success ? 'completed' : 'failed',
          restore_end_time: new Date().toISOString(),
          error_message: success ? null : 'Simulated restore failure for testing'
        })
        .eq('id', restoreId);
        
      loadData();
    }, 5000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateRestoreDuration = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    return `${Math.round(duration / 1000)}s`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Backup Restore Manager</h1>
        
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogTrigger asChild>
            <Button>
              <RotateCcw className="h-4 w-4 mr-2" />
              Initiate Restore
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Restore Database</DialogTitle>
              <DialogDescription>
                Select a verified backup to restore from. This operation cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="backup-select">Select Backup</Label>
                <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a backup..." />
                  </SelectTrigger>
                  <SelectContent>
                    {backupJobs.map((backup) => (
                      <SelectItem key={backup.id} value={backup.id}>
                        {backup.backup_name} - {formatDateTime(backup.backup_start_time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="restore-type">Restore Type</Label>
                <Select value={restoreType} onValueChange={setRestoreType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Restore</SelectItem>
                    <SelectItem value="partial">Partial Restore</SelectItem>
                    <SelectItem value="point_in_time">Point-in-Time Recovery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {restoreType === 'point_in_time' && (
                <div>
                  <Label htmlFor="target-timestamp">Target Timestamp</Label>
                  <Input
                    type="datetime-local"
                    value={targetTimestamp}
                    onChange={(e) => setTargetTimestamp(e.target.value)}
                  />
                </div>
              )}
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Warning: This will overwrite current database data. Ensure you have a recent backup before proceeding.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={initiateRestore} 
                  disabled={!selectedBackup || loading}
                >
                  {loading ? 'Initiating...' : 'Start Restore'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Available Backups for Restore</CardTitle>
          <CardDescription>
            Only verified, successful backups are available for restore operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backupJobs.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{backup.backup_name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(backup.backup_start_time)} • {backup.backup_type}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="default">Verified</Badge>
                  <Badge variant="outline">
                    {(backup.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Restore Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Restore Operations</CardTitle>
          <CardDescription>Track the status of database restore operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {restoreOps.map((restore) => (
              <div key={restore.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(restore.status)}
                  <div>
                    <p className="font-medium">{restore.restore_type} restore</p>
                    <p className="text-sm text-gray-500">
                      Started: {formatDateTime(restore.restore_start_time)}
                      {restore.restore_end_time && (
                        <> • Duration: {calculateRestoreDuration(restore.restore_start_time, restore.restore_end_time)}</>
                      )}
                    </p>
                    {restore.error_message && (
                      <p className="text-sm text-red-500">{restore.error_message}</p>
                    )}
                  </div>
                </div>
                
                <Badge variant={restore.status === 'completed' ? 'default' : 
                              restore.status === 'failed' ? 'destructive' : 'secondary'}>
                  {restore.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};