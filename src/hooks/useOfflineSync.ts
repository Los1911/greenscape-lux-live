import { useState, useEffect, useCallback } from 'react'
import { offlinePhotoStorage } from '@/services/offlinePhotoStorage'
import { supabase } from '@/lib/supabase'
import { Jobs } from '@/db/contracts'
import { useToast } from '@/components/SharedUI/Toast'

interface SyncProgress {
  total: number
  completed: number
  current?: string
  error?: string
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ total: 0, completed: 0 })
  const [pendingCount, setPendingCount] = useState(0)
  const { showToast } = useToast()

  const updateOnlineStatus = useCallback(() => {
    setIsOnline(navigator.onLine)
  }, [])

  const checkPendingPhotos = useCallback(async () => {
    try {
      const stats = await offlinePhotoStorage.getStorageStats()
      setPendingCount(stats.pending + stats.failed)
    } catch (error) {
      console.error('Failed to check pending photos:', error)
    }
  }, [])

  const uploadPhoto = async (photo: any): Promise<boolean> => {
    try {
      await offlinePhotoStorage.updatePhotoStatus(photo.id, 'uploading')
      
      // Convert stored photo back to File
      const file = offlinePhotoStorage.getFileFromStored(photo)
      
      const ts = Date.now()
      const path = `${photo.jobId}/${ts}_${photo.type}_${photo.fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(path, file, { 
          upsert: false, 
          contentType: photo.fileType 
        })
      
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
      return true
    } catch (error: any) {
      await offlinePhotoStorage.updatePhotoStatus(
        photo.id, 
        'failed', 
        error.message
      )
      return false
    }
  }

  const syncPendingPhotos = useCallback(async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    try {
      const pendingPhotos = await offlinePhotoStorage.getPendingPhotos()
      
      if (pendingPhotos.length === 0) {
        setIsSyncing(false)
        return
      }

      setSyncProgress({ total: pendingPhotos.length, completed: 0 })
      
      const jobGroups = new Map<string, any[]>()
      pendingPhotos.forEach(photo => {
        if (!jobGroups.has(photo.jobId)) {
          jobGroups.set(photo.jobId, [])
        }
        jobGroups.get(photo.jobId)!.push(photo)
      })

      let completed = 0
      for (const [jobId, photos] of jobGroups) {
        const beforePhoto = photos.find(p => p.type === 'before')
        const afterPhoto = photos.find(p => p.type === 'after')
        
        if (!beforePhoto || !afterPhoto) {
          // Upload individual photos
          for (const photo of photos) {
            setSyncProgress(prev => ({ ...prev, current: photo.fileName }))
            await uploadPhoto(photo)
            completed++
            setSyncProgress(prev => ({ ...prev, completed }))
          }
          continue
        }

        // Upload both photos and complete job
        setSyncProgress(prev => ({ ...prev, current: beforePhoto.fileName }))
        const beforeSuccess = await uploadPhoto(beforePhoto)
        completed++
        setSyncProgress(prev => ({ ...prev, completed }))

        if (beforeSuccess) {
          setSyncProgress(prev => ({ ...prev, current: afterPhoto.fileName }))
          const afterSuccess = await uploadPhoto(afterPhoto)
          completed++
          setSyncProgress(prev => ({ ...prev, completed }))

          if (afterSuccess) {
            try {
              await Jobs.complete(supabase, jobId)
              showToast('Job completed successfully', 'success')
            } catch (error: any) {
              console.error('Failed to complete job:', error)
            }
          }
        }
      }

      await offlinePhotoStorage.clearCompleted()
      await checkPendingPhotos()
      showToast(`Synced ${completed} photos`, 'success')
      
    } catch (error: any) {
      console.error('Sync failed:', error)
      setSyncProgress(prev => ({ ...prev, error: error.message }))
      showToast('Sync failed', 'error')
    } finally {
      setIsSyncing(false)
      setSyncProgress({ total: 0, completed: 0 })
    }
  }, [isOnline, isSyncing, showToast, checkPendingPhotos])

  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [updateOnlineStatus])

  useEffect(() => {
    checkPendingPhotos()
  }, [checkPendingPhotos])

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      const timer = setTimeout(syncPendingPhotos, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, pendingCount, syncPendingPhotos])

  return {
    isOnline,
    isSyncing,
    syncProgress,
    pendingCount,
    syncPendingPhotos,
    checkPendingPhotos
  }
}