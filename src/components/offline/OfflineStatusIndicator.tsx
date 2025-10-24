import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive
} from 'lucide-react'

import { offlineStorage } from '@/services/OfflineStorageService'
import { offlineSyncManager } from '@/services/OfflineSyncManager'
import { offlinePhotoStorage } from '@/services/offlinePhotoStorage'

interface StorageStats {
  jobs: number
  photos: number
  messages: number
  pendingSync: number
}

interface SyncProgress {
  isActive: boolean
  progress: number
  current?: string
  total: number
  completed: number
}

export const OfflineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [storageStats, setStorageStats] = useState<StorageStats>({
    jobs: 0, photos: 0, messages: 0, pendingSync: 0
  })
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    isActive: false, progress: 0, total: 0, completed: 0
  })
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    loadStorageStats()
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    const unsubscribe = offlineSyncManager.onSyncComplete((result) => {
      setSyncProgress({ isActive: false, progress: 100, total: 0, completed: 0 })
      setLastSyncTime(new Date())
      loadStorageStats()
    })
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStorageStats, 30000)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadStorageStats = async () => {
    try {
      const [dbStats, photoStats] = await Promise.all([
        offlineStorage.getStorageStats(),
        offlinePhotoStorage.getStorageStats()
      ])
      
      setStorageStats({
        ...dbStats,
        photos: photoStats.total
      })
    } catch (error) {
      console.error('Failed to load storage stats:', error)
    }
  }

  const handleSync = async () => {
    if (!isOnline || syncProgress.isActive) return
    
    setSyncProgress({ isActive: true, progress: 0, total: 100, completed: 0 })
    await offlineSyncManager.performFullSync()
  }

  const getConnectionStatus = () => {
    if (isOnline) {
      return {
        icon: <Wifi className="h-4 w-4 text-green-500" />,
        text: 'Online',
        color: 'bg-green-100 text-green-800 border-green-200'
      }
    } else {
      return {
        icon: <WifiOff className="h-4 w-4 text-red-500" />,
        text: 'Offline',
        color: 'bg-red-100 text-red-800 border-red-200'
      }
    }
  }

  const getSyncStatus = () => {
    if (syncProgress.isActive) {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />,
        text: 'Syncing...',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    } else if (storageStats.pendingSync > 0) {
      return {
        icon: <Clock className="h-4 w-4 text-yellow-500" />,
        text: `${storageStats.pendingSync} pending`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      }
    } else {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        text: 'Synced',
        color: 'bg-green-100 text-green-800 border-green-200'
      }
    }
  }

  const connection = getConnectionStatus()
  const sync = getSyncStatus()

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Connection and sync status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={connection.color}>
                {connection.icon}
                <span className="ml-1">{connection.text}</span>
              </Badge>
              
              <Badge variant="outline" className={sync.color}>
                {sync.icon}
                <span className="ml-1">{sync.text}</span>
              </Badge>
            </div>
            
            <Button
              size="sm"
              onClick={handleSync}
              disabled={!isOnline || syncProgress.isActive}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncProgress.isActive ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>

          {/* Sync progress */}
          {syncProgress.isActive && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Syncing data...</span>
                <span>{Math.round(syncProgress.progress)}%</span>
              </div>
              <Progress value={syncProgress.progress} className="h-2" />
              {syncProgress.current && (
                <p className="text-xs text-gray-500 truncate">
                  Current: {syncProgress.current}
                </p>
              )}
            </div>
          )}

          {/* Storage stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span>{storageStats.jobs} Jobs</span>
            </div>
            
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-500" />
              <span>{storageStats.photos} Photos</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span>{storageStats.pendingSync} Pending</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>
                {lastSyncTime 
                  ? `${lastSyncTime.toLocaleTimeString()}` 
                  : 'Never'
                }
              </span>
            </div>
          </div>

          {/* Offline warning */}
          {!isOnline && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                You're offline. Changes will sync when connection is restored.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}