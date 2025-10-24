import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  X, 
  RotateCcw, 
  MapPin, 
  Loader2, 
  Zap, 
  ZapOff,
  Grid3X3,
  Circle,
  Square,
  Settings
} from 'lucide-react'
import { useCamera, useGPS } from '@/hooks/useCamera'
import { compressImage } from '@/utils/imageCompression'
import { addMetadataToImage, formatGPSForDisplay } from '@/utils/imageMetadata'
import { useToast } from '@/components/SharedUI/Toast'

interface EnhancedCameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  title?: string
  includeGPS?: boolean
  maxFileSize?: number
  compressionQuality?: number
}

export default function EnhancedCameraCapture({ 
  isOpen, 
  onClose, 
  onCapture, 
  title = "Capture Job Photo",
  includeGPS = true,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  compressionQuality = 0.8
}: EnhancedCameraCaptureProps) {
  const { showToast } = useToast()
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null)
  const [gpsData, setGpsData] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [gridEnabled, setGridEnabled] = useState(true)
  const [captureMode, setCaptureMode] = useState<'photo' | 'burst'>('photo')

  const {
    isSupported: cameraSupported,
    isActive,
    error: cameraError,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto
  } = useCamera()

  const {
    isSupported: gpsSupported,
    isLoading: gpsLoading,
    error: gpsError,
    getCurrentPosition
  } = useGPS()

  useEffect(() => {
    if (isOpen && cameraSupported) {
      startCamera({ 
        facingMode,
        width: 1920,
        height: 1080
      })
      
      if (includeGPS && gpsSupported) {
        getCurrentPosition().then(setGpsData)
      }
    }
    
    return () => {
      if (isActive) {
        stopCamera()
      }
    }
  }, [isOpen, facingMode, cameraSupported, gpsSupported, includeGPS])

  const handleCapture = useCallback(async () => {
    try {
      const photo = await capturePhoto()
      if (!photo) {
        showToast('Failed to capture photo', 'error')
        return
      }
      
      // Check file size
      if (photo.size > maxFileSize) {
        showToast(`Photo too large (${(photo.size / 1024 / 1024).toFixed(1)}MB). Max size: ${maxFileSize / 1024 / 1024}MB`, 'error')
        return
      }
      
      setCapturedPhoto(photo)
      
      // Provide haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } catch (error) {
      showToast('Failed to capture photo', 'error')
    }
  }, [capturePhoto, maxFileSize, showToast])

  const handleConfirm = async () => {
    if (!capturedPhoto) return
    
    setProcessing(true)
    try {
      // Compress image
      const compressed = await compressImage(capturedPhoto, 1920, compressionQuality)
      
      // Add metadata if GPS is available
      let finalFile = compressed
      if (includeGPS && gpsData) {
        finalFile = await addMetadataToImage(compressed, gpsData)
      }
      
      onCapture(finalFile)
      onClose()
      setCapturedPhoto(null)
      
      showToast('Photo captured successfully!', 'success')
    } catch (error) {
      showToast('Failed to process photo', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleRetake = () => {
    setCapturedPhoto(null)
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  if (!cameraSupported) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black/95 border border-red-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400">Camera Not Supported</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">Your device doesn't support camera access.</p>
            <p className="text-sm text-gray-400">
              Please ensure you're using a modern browser and have granted camera permissions.
            </p>
          </div>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border border-green-500/30 text-white max-w-md p-0 max-h-[95vh]">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-green-400 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          {capturedPhoto ? (
            <div className="aspect-square bg-black flex items-center justify-center">
              <img 
                src={URL.createObjectURL(capturedPhoto)} 
                alt="Captured" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-square bg-black relative overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Grid overlay */}
              {gridEnabled && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/20" />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Camera controls overlay */}
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setGridEnabled(!gridEnabled)}
                  className={`p-2 ${gridEnabled ? 'bg-green-600/50' : 'bg-black/50'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleCamera}
                  className="p-2 bg-black/50"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
              
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                  <p className="text-red-300 text-sm text-center px-4">{cameraError}</p>
                </div>
              )}
            </div>
          )}

          {/* Status indicators */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {includeGPS && (
              <Badge variant="outline" className={`text-xs ${
                gpsLoading ? 'border-yellow-400 text-yellow-400' :
                gpsData ? 'border-green-400 text-green-400' :
                'border-red-400 text-red-400'
              }`}>
                {gpsLoading ? (
                  <><Loader2 className="w-3 h-3 animate-spin mr-1" />GPS...</>
                ) : gpsData ? (
                  <><MapPin className="w-3 h-3 mr-1" />{formatGPSForDisplay(gpsData).accuracy}</>
                ) : (
                  'No GPS'
                )}
              </Badge>
            )}
            
            <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">
              {facingMode === 'environment' ? 'Rear' : 'Front'}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {capturedPhoto ? (
            <div className="flex gap-2">
              <Button
                onClick={handleRetake}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300"
              >
                Retake
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Use Photo'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                <Button
                  onClick={handleCapture}
                  disabled={!isActive}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 p-0"
                >
                  <Circle className="w-8 h-8" />
                </Button>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Quality: {Math.round(compressionQuality * 100)}%</span>
                <span>Max: {maxFileSize / 1024 / 1024}MB</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}