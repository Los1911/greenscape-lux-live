import { offlineStorage } from './OfflineStorageService'
import { offlinePhotoStorage } from './offlinePhotoStorage'
import { supabase } from '@/lib/supabase'

interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: string[]
}

class OfflineSyncManager {
  private isOnline = navigator.onLine
  private syncInProgress = false
  private syncListeners: ((result: SyncResult) => void)[] = []

  constructor() {
    this.setupNetworkListeners()
    this.startPeriodicSync()
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.performFullSync()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  private startPeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performFullSync()
      }
    }, 30000) // Sync every 30 seconds when online
  }

  async performFullSync(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress or offline'] }
    }

    this.syncInProgress = true
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      // Sync jobs first
      const jobResult = await this.syncJobs()
      result.synced += jobResult.synced
      result.failed += jobResult.failed
      result.errors.push(...jobResult.errors)

      // Sync photos
      const photoResult = await this.syncPhotos()
      result.synced += photoResult.synced
      result.failed += photoResult.failed
      result.errors.push(...photoResult.errors)

      // Download fresh data
      await this.downloadFreshData()

    } catch (error: any) {
      result.success = false
      result.errors.push(error.message)
    } finally {
      this.syncInProgress = false
      this.notifyListeners(result)
    }

    return result
  }

  private async syncJobs(): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }
    
    try {
      const pendingItems = await offlineStorage.getPendingSync()
      const jobItems = pendingItems.filter(item => item.type === 'job')

      for (const item of jobItems) {
        try {
          const jobs = await offlineStorage.getJobs()
          const job = jobs.find(j => j.id === item.itemId)
          
          if (!job) continue

          if (item.action === 'update') {
            const { error } = await supabase
              .from('jobs')
              .update({
                status: job.status,
                notes: job.notes,
                updated_at: new Date().toISOString()
              })
              .eq('id', job.id)

            if (error) throw error
            
            // Mark as synced
            await offlineStorage.updateJob(job.id, { syncStatus: 'synced' })
            result.synced++
          }
        } catch (error: any) {
          result.failed++
          result.errors.push(`Job ${item.itemId}: ${error.message}`)
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push(error.message)
    }

    return result
  }

  private async syncPhotos(): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }
    
    try {
      const pendingPhotos = await offlinePhotoStorage.getPendingPhotos()
      
      for (const photo of pendingPhotos) {
        try {
          const file = offlinePhotoStorage.getFileFromStored(photo)
          const path = `${photo.jobId}/${Date.now()}_${photo.type}_${photo.fileName}`
          
          const { error: uploadError } = await supabase.storage
            .from('job-photos')
            .upload(path, file)
          
          if (uploadError) throw uploadError

          const { data: publicUrl } = supabase.storage
            .from('job-photos')
            .getPublicUrl(path)
          
          const { error: insertError } = await supabase
            .from('job_photos')
            .insert({
              job_id: photo.jobId,
              file_url: publicUrl.publicUrl,
              type: photo.type,
              uploaded_at: new Date().toISOString(),
              metadata: photo.metadata
            })
          
          if (insertError) throw insertError
          
          await offlinePhotoStorage.updatePhotoStatus(photo.id, 'completed')
          result.synced++
        } catch (error: any) {
          await offlinePhotoStorage.updatePhotoStatus(photo.id, 'failed', error.message)
          result.failed++
          result.errors.push(`Photo ${photo.id}: ${error.message}`)
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push(error.message)
    }

    return result
  }

  private async downloadFreshData(): Promise<void> {
    try {
      // Get user ID from auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Download fresh jobs
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('landscaper_id', user.id)
        .order('scheduled_date', { ascending: true })

      if (!error && jobs) {
        const offlineJobs = jobs.map(job => ({
          ...job,
          lastModified: Date.now(),
          syncStatus: 'synced' as const
        }))
        await offlineStorage.storeJobs(offlineJobs)
      }
    } catch (error) {
      console.error('Failed to download fresh data:', error)
    }
  }

  onSyncComplete(callback: (result: SyncResult) => void): () => void {
    this.syncListeners.push(callback)
    return () => {
      const index = this.syncListeners.indexOf(callback)
      if (index > -1) {
        this.syncListeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => listener(result))
  }

  getNetworkStatus(): boolean {
    return this.isOnline
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress
  }
}

export const offlineSyncManager = new OfflineSyncManager()