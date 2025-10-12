import { useState, useEffect, useCallback } from 'react'
import { offlineStorage } from '@/services/OfflineStorageService'
import { offlineSyncManager } from '@/services/OfflineSyncManager'
import { supabase } from '@/lib/supabase'

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

export function useOfflineData() {
  const [jobs, setJobs] = useState<OfflineJob[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Initialize offline storage
  useEffect(() => {
    offlineStorage.init().catch(console.error)
  }, [])

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncError(null)
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync completion handler
  useEffect(() => {
    const unsubscribe = offlineSyncManager.onSyncComplete((result) => {
      setIsSyncing(false)
      setLastSyncTime(new Date())
      
      if (result.success) {
        setSyncError(null)
        loadJobs()
      } else {
        setSyncError(result.errors.join(', '))
      }
    })

    return unsubscribe
  }, [])

  const loadJobs = useCallback(async () => {
    try {
      const offlineJobs = await offlineStorage.getJobs()
      setJobs(offlineJobs.sort((a, b) => 
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      ))
    } catch (error) {
      console.error('Failed to load offline jobs:', error)
    }
  }, [])

  const downloadFreshData = useCallback(async () => {
    if (!isOnline) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('landscaper_id', user.id)
        .order('scheduled_date', { ascending: true })

      if (!error && jobs) {
        const offlineJobs = jobs.map(job => ({
          id: job.id,
          client_name: job.client_name || 'Unknown Client',
          service_type: job.service_type || 'General Service',
          address: job.address || '',
          scheduled_date: job.scheduled_date || new Date().toISOString(),
          status: job.status || 'pending',
          description: job.description,
          notes: job.notes,
          priority: job.priority || 'medium',
          estimated_duration: job.estimated_duration,
          lastModified: Date.now(),
          syncStatus: 'synced' as const
        }))
        
        await offlineStorage.storeJobs(offlineJobs)
        setJobs(offlineJobs)
      }
    } catch (error) {
      console.error('Failed to download fresh data:', error)
    }
  }, [isOnline])

  const updateJob = useCallback(async (
    jobId: string, 
    updates: Partial<OfflineJob>
  ) => {
    try {
      await offlineStorage.updateJob(jobId, updates)
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, ...updates, syncStatus: 'pending', lastModified: Date.now() }
          : job
      ))
    } catch (error) {
      console.error('Failed to update job:', error)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    setSyncError(null)
    await offlineSyncManager.performFullSync()
  }, [isOnline, isSyncing])

  const getPendingSyncCount = useCallback(() => {
    return jobs.filter(job => job.syncStatus === 'pending').length
  }, [jobs])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && !isSyncing && getPendingSyncCount() > 0) {
      const timer = setTimeout(triggerSync, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, isSyncing, triggerSync, getPendingSyncCount])

  // Load jobs on mount
  useEffect(() => {
    loadJobs()
    if (isOnline) {
      downloadFreshData()
    }
  }, [loadJobs, downloadFreshData, isOnline])

  return {
    jobs,
    isOnline,
    isSyncing,
    lastSyncTime,
    syncError,
    pendingSyncCount: getPendingSyncCount(),
    updateJob,
    triggerSync,
    downloadFreshData,
    loadJobs
  }
}