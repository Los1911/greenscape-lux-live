import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, X, RotateCcw, MapPin, Loader2 } from 'lucide-react'
import { useCamera, useGPS } from '@/hooks/useCamera'
import { compressImage } from '@/utils/imageCompression'
import { addMetadataToImage, formatGPSForDisplay } from '@/utils/imageMetadata'
import { useToast } from '@/components/SharedUI/Toast'

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  title?: string
  includeGPS?: boolean
}

export default function CameraCapture({ 
  isOpen, 
  onClose, 
  onCapture, 
  title = "Take Photo",
  includeGPS = true 
}: CameraCaptureProps) {
  const { showToast } = useToast()
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null)
  const [gpsData, setGpsData] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

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
      startCamera({ facingMode })
      
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

  const handleCapture = async () => {
    const photo = await capturePhoto()
    if (!photo) {
      showToast('Failed to capture photo', 'error')
      return
    }
    
    setCapturedPhoto(photo)
  }

  const handleConfirm = async () => {
    if (!capturedPhoto) return
    
    setProcessing(true)
    try {
      // Compress image
      const compressed = await compressImage(capturedPhoto, 1920, 0.8)
      
      // Add metadata if GPS is available
      let finalFile = compressed
      if (includeGPS && gpsData) {
        finalFile = await addMetadataToImage(compressed, gpsData)
      }
      
      onCapture(finalFile)
      onClose()
      setCapturedPhoto(null)
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
          <p className="text-gray-300">Your device doesn't support camera access.</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border border-green-500/30 text-white max-w-md p-0 max-h-[90vh]">
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
              
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                  <p className="text-red-300 text-sm text-center px-4">{cameraError}</p>
                </div>
              )}
            </div>
          )}

          {/* GPS Status */}
          {includeGPS && (
            <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1 text-xs">
              {gpsLoading ? (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  GPS...
                </div>
              ) : gpsData ? (
                <div className="flex items-center gap-1 text-green-400">
                  <MapPin className="w-3 h-3" />
                  {formatGPSForDisplay(gpsData).accuracy}
                </div>
              ) : gpsError ? (
                <div className="text-red-400 text-xs">No GPS</div>
              ) : null}
            </div>
          )}
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
            <div className="flex gap-2">
              <Button
                onClick={toggleCamera}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleCapture}
                disabled={!isActive}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}