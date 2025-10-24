import React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, Share2, MapPin, Clock, Smartphone, Camera } from "lucide-react"

interface PhotoPreviewModalProps {
  photo: {
    id: string
    file_url: string
    type: 'before' | 'after'
    uploaded_at: string
    job_id: string
    metadata?: {
      gps?: { latitude: number; longitude: number }
      deviceInfo?: { userAgent: string; timestamp: number; timezone?: string }
    }
  } | null
  jobTitle?: string
  isOpen: boolean
  onClose: () => void
  onDownload: (photo: any) => void
  onShare: (photo: any) => void
}

export default function PhotoPreviewModal({ 
  photo, 
  jobTitle, 
  isOpen, 
  onClose, 
  onDownload, 
  onShare 
}: PhotoPreviewModalProps) {
  if (!photo) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatGPS = (gps: { latitude: number; longitude: number }) => {
    return `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`
  }

  const getDeviceType = (userAgent?: string) => {
    if (!userAgent) return 'Unknown'
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS Device'
    if (/Android/.test(userAgent)) return 'Android Device'
    if (/Windows/.test(userAgent)) return 'Windows Device'
    return 'Mobile Device'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full bg-black/95 backdrop-blur border border-green-500/30 text-white p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-green-400" />
            <div>
              <h3 className="font-semibold text-green-400">
                {photo.type === 'before' ? 'Before Photo' : 'After Photo'}
              </h3>
              {jobTitle && (
                <p className="text-sm text-gray-400">{jobTitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDownload(photo)}
              className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onShare(photo)}
              className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Image */}
          <div className="flex-1 p-4">
            <div className="relative">
              <img
                src={photo.file_url}
                alt={`${photo.type} photo`}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Metadata Sidebar */}
          <div className="w-full lg:w-80 p-4 border-t lg:border-t-0 lg:border-l border-gray-700/50 space-y-4">
            <h4 className="font-semibold text-green-400 mb-3">Photo Details</h4>
            
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-300">Captured</p>
                  <p className="text-white font-medium">{formatDate(photo.uploaded_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Camera className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-300">Type</p>
                  <p className={`font-medium ${
                    photo.type === 'before' ? 'text-blue-400' : 'text-green-400'
                  }`}>
                    {photo.type === 'before' ? 'Before Photo' : 'After Photo'}
                  </p>
                </div>
              </div>

              {/* GPS Location */}
              {photo.metadata?.gps && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-300">GPS Location</p>
                    <p className="text-white font-mono text-xs">
                      {formatGPS(photo.metadata.gps)}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const url = `https://maps.google.com/?q=${photo.metadata!.gps!.latitude},${photo.metadata!.gps!.longitude}`
                        window.open(url, '_blank')
                      }}
                      className="text-green-400 hover:text-green-300 p-0 h-auto font-normal text-xs mt-1"
                    >
                      View on Maps
                    </Button>
                  </div>
                </div>
              )}

              {/* Device Info */}
              {photo.metadata?.deviceInfo && (
                <div className="flex items-start gap-3 text-sm">
                  <Smartphone className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-300">Device</p>
                    <p className="text-white font-medium">
                      {getDeviceType(photo.metadata.deviceInfo.userAgent)}
                    </p>
                    {photo.metadata.deviceInfo.timezone && (
                      <p className="text-gray-400 text-xs mt-1">
                        {photo.metadata.deviceInfo.timezone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-700/50 space-y-2">
              <Button
                onClick={() => onDownload(photo)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Photo
              </Button>
              <Button
                onClick={() => onShare(photo)}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800/50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Photo
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}