import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  MapPin, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Calendar
} from 'lucide-react'

import { offlineStorage } from '@/services/OfflineStorageService'
import { offlineSyncManager } from '@/services/OfflineSyncManager'

interface OfflineJob {
  id: string
  client_name: string
  service_type: string
  address: string
  scheduled_date: string
  status: 'pending' | 'in_progress' | 'completed'
  description?: string
  notes?: string
  priority: 'low' | 'medium' | 'high'
  estimated_duration?: number
  lastModified: number
  syncStatus: 'synced' | 'pending' | 'failed'
}

export const OfflineJobManager: React.FC = () => {
  const [jobs, setJobs] = useState<OfflineJob[]>([])
  const [selectedJob, setSelectedJob] = useState<OfflineJob | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadJobs()
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    const unsubscribe = offlineSyncManager.onSyncComplete((result) => {
      setIsSyncing(false)
      if (result.success) {
        loadJobs()
      }
    })
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [])

  const loadJobs = async () => {
    try {
      const offlineJobs = await offlineStorage.getJobs()
      setJobs(offlineJobs.sort((a, b) => 
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      ))
    } catch (error) {
      console.error('Failed to load offline jobs:', error)
    }
  }

  const updateJobStatus = async (jobId: string, status: OfflineJob['status']) => {
    try {
      await offlineStorage.updateJob(jobId, { status })
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status, syncStatus: 'pending' } : job
      ))
    } catch (error) {
      console.error('Failed to update job status:', error)
    }
  }

  const updateJobNotes = async (jobId: string, notes: string) => {
    try {
      await offlineStorage.updateJob(jobId, { notes })
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, notes, syncStatus: 'pending' } : job
      ))
    } catch (error) {
      console.error('Failed to update job notes:', error)
    }
  }

  const triggerSync = async () => {
    if (!isOnline || isSyncing) return
    
    setIsSyncing(true)
    await offlineSyncManager.performFullSync()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'in_progress': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getSyncStatusIcon = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with sync status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Offline Jobs</h2>
          {isOnline ? (
            <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
          )}
        </div>
        
        <Button 
          onClick={triggerSync}
          disabled={!isOnline || isSyncing}
          className="flex items-center gap-2 bg-green-500/20 text-green-200 border border-green-500/50 hover:bg-green-500/30 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {/* Jobs grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job) => (
          <Card 
            key={job.id} 
            className={`cursor-pointer transition-all hover:shadow-lg bg-black/60 border-green-500/25 text-white p-4 ${
              selectedJob?.id === job.id ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => setSelectedJob(job)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-green-300 text-base sm:text-lg leading-tight">{job.client_name}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getSyncStatusIcon(job.syncStatus)}
                  <Badge className={`${getStatusColor(job.status)} text-xs px-2 py-1`}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-200/70">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{job.address}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-green-200/70">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{new Date(job.scheduled_date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-green-200/70">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{job.service_type}</span>
                </div>
                
                {job.estimated_duration && (
                  <div className="flex items-center gap-2 text-sm text-green-200/70">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{job.estimated_duration} hours</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-8 text-green-300/50">
          <p className="text-sm sm:text-base">0 Jobs</p>
          <p className="text-xs mt-1">No photos yet. Take or upload photos to document job progress.</p>
        </div>
      )}

      {/* Job details modal */}
      {selectedJob && (
        <Card className="mt-4 sm:mt-6 bg-black/60 border-green-500/25 text-white">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-green-300">Job Details</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedJob(null)}
                className="border-green-500/50 text-green-200 hover:bg-green-500/20 w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <Button
                  onClick={() => updateJobStatus(selectedJob.id, 'pending')}
                  variant={selectedJob.status === 'pending' ? 'default' : 'outline'}
                  className={`w-full ${selectedJob.status === 'pending' ? 'bg-green-500 text-white' : 'border-green-500/50 text-green-200 hover:bg-green-500/20'}`}
                >
                  Pending
                </Button>
                <Button
                  onClick={() => updateJobStatus(selectedJob.id, 'in_progress')}
                  variant={selectedJob.status === 'in_progress' ? 'default' : 'outline'}
                  className={`w-full ${selectedJob.status === 'in_progress' ? 'bg-green-500 text-white' : 'border-green-500/50 text-green-200 hover:bg-green-500/20'}`}
                >
                  In Progress
                </Button>
                <Button
                  onClick={() => updateJobStatus(selectedJob.id, 'completed')}
                  variant={selectedJob.status === 'completed' ? 'default' : 'outline'}
                  className={`w-full ${selectedJob.status === 'completed' ? 'bg-green-500 text-white' : 'border-green-500/50 text-green-200 hover:bg-green-500/20'}`}
                >
                  Completed
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-300">Notes</label>
                <Textarea
                  value={notes || selectedJob.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add job notes..."
                  rows={4}
                  className="bg-black/40 border-green-500/25 text-white placeholder:text-green-200/50"
                />
                <Button
                  onClick={() => {
                    updateJobNotes(selectedJob.id, notes)
                    setNotes('')
                  }}
                  className="w-full bg-green-500 text-white hover:bg-green-600"
                >
                  Update Notes
                </Button>
              </div>
              
              {selectedJob.description && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-300">Description</label>
                  <p className="text-sm text-green-200/70 p-3 bg-black/40 border border-green-500/25 rounded">
                    {selectedJob.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}