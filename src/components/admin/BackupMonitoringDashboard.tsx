import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { 
  Database, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Play,
  RefreshCw
} from 'lucide-react';

interface BackupJob {
  id: string;
  backup_name: string;
  backup_type: string;
  status: string;
  file_size_bytes: number;
  backup_start_time: string;
  backup_end_time: string;
  verification_status: string;
  error_message: string;
}

interface BackupSchedule {
  id: string;
  name: string;
  schedule_cron: string;
  backup_type: string;
  is_active: boolean;
  retention_days: number;
}

export const BackupMonitoringDashboard: React.FC = () => {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBackups: 0,
    successfulBackups: 0,
    failedBackups: 0,
    totalSize: 0
  });

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      const [jobsResponse, schedulesResponse] = await Promise.all([
        supabase.from('backup_jobs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('backup_schedules').select('*').order('created_at', { ascending: false })
      ]);

      if (jobsResponse.data) {
        setBackupJobs(jobsResponse.data);
        calculateStats(jobsResponse.data);
      }
      if (schedulesResponse.data) setSchedules(schedulesResponse.data);
    } catch (error) {
      console.error('Failed to load backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (jobs: BackupJob[]) => {
    const stats = jobs.reduce((acc, job) => {
      acc.totalBackups++;
      if (job.status === 'completed') acc.successfulBackups++;
      if (job.status === 'failed') acc.failedBackups++;
      acc.totalSize += job.file_size_bytes || 0;
      return acc;
    }, { totalBackups: 0, successfulBackups: 0, failedBackups: 0, totalSize: 0 });
    
    setStats(stats);
  };

  const triggerBackup = async (scheduleId: string, backupType: string) => {
    try {
      const { data } = await supabase.functions.invoke('automated-backup-scheduler', {
        body: { action: 'create_backup', scheduleId, backupType }
      });
      
      if (data?.success) {
        loadBackupData();
      }
    } catch (error) {
      console.error('Failed to trigger backup:', error);
    }
  };

  const verifyBackup = async (backupJobId: string) => {
    try {
      await supabase.functions.invoke('automated-backup-scheduler', {
        body: { action: 'verify_backup', backupJobId }
      });
      loadBackupData();
    } catch (error) {
      console.error('Failed to verify backup:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      running: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="p-6">Loading backup dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Backup Monitoring Dashboard</h1>
        <Button onClick={loadBackupData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Backups</p>
                <p className="text-2xl font-bold">{stats.totalBackups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Successful</p>
                <p className="text-2xl font-bold">{stats.successfulBackups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Failed</p>
                <p className="text-2xl font-bold">{stats.failedBackups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Total Size</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Recent Backups</TabsTrigger>
          <TabsTrigger value="schedules">Backup Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Backup Jobs</CardTitle>
              <CardDescription>Monitor backup job status and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{job.backup_name}</p>
                        <p className="text-sm text-gray-500">
                          {job.backup_type} • {formatFileSize(job.file_size_bytes || 0)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(job.status)}
                      {job.verification_status && (
                        <Badge variant={job.verification_status === 'passed' ? 'default' : 'destructive'}>
                          {job.verification_status}
                        </Badge>
                      )}
                      
                      {job.status === 'completed' && !job.verification_status && (
                        <Button size="sm" onClick={() => verifyBackup(job.id)}>
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Backup Schedules</CardTitle>
              <CardDescription>Manage automated backup schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{schedule.name}</p>
                      <p className="text-sm text-gray-500">
                        {schedule.schedule_cron} • {schedule.backup_type} • {schedule.retention_days} days retention
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      
                      <Button 
                        size="sm" 
                        onClick={() => triggerBackup(schedule.id, schedule.backup_type)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Run Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};