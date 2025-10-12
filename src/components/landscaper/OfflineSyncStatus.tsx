import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Wifi, 
  WifiOff, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Camera
} from 'lucide-react'
import { useOfflineSync } from '@/hooks/useOfflineSync'

export const OfflineSyncStatus = () => {
  const { 
    isOnline, 
    isSyncing, 
    syncProgress, 
    pendingCount, 
    syncPendingPhotos 
  } = useOfflineSync()

  if (pendingCount === 0 && isOnline) return null

  return (
    <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-400 flex-shrink-0" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-white font-medium whitespace-nowrap">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {pendingCount > 0 && (
                <div className="flex items-center gap-1 text-amber-400">
                  <Camera className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm whitespace-nowrap">{pendingCount} photos pending</span>
                </div>
              )}
            </div>
            
            {isSyncing && (
              <div className="text-sm text-slate-400 mt-1 break-words">
                {syncProgress.current ? `Uploading ${syncProgress.current}` : 'Syncing...'}
              </div>
            )}
            
            {!isOnline && pendingCount > 0 && (
              <div className="text-sm text-slate-400 mt-1 break-words">
                Photos will sync when connection is restored
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isSyncing ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
              <span className="text-sm text-blue-400 whitespace-nowrap">
                {syncProgress.completed}/{syncProgress.total}
              </span>
            </div>
          ) : (
            <>
              {pendingCount > 0 && isOnline && (
                <Button
                  onClick={syncPendingPhotos}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                >
                  <Upload className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="whitespace-nowrap">Sync Now</span>
                </Button>
              )}
              
              {syncProgress.error && (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
            </>
          )}
        </div>
      </div>

      {isSyncing && syncProgress.total > 0 && (
        <div className="mt-3">
          <Progress 
            value={(syncProgress.completed / syncProgress.total) * 100}
            className="h-2 bg-slate-700"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Syncing photos...</span>
            <span>{Math.round((syncProgress.completed / syncProgress.total) * 100)}%</span>
          </div>
        </div>
      )}

      {syncProgress.error && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-sm">
          Sync error: {syncProgress.error}
        </div>
      )}
    </Card>
  )
}