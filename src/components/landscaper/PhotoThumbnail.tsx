import React from "react"
import { Button } from "@/components/ui/button"
import { Download, Share2, Eye, MapPin, Clock, Smartphone } from "lucide-react"

interface PhotoThumbnailProps {
  photo: {
    id: string
    file_url: string
    type: 'before' | 'after'
    uploaded_at: string
    job_id: string
    metadata?: {
      gps?: { latitude: number; longitude: number }
      deviceInfo?: { userAgent: string; timestamp: number }
    }
  }
  jobTitle?: string
  onPreview: (photo: any) => void
  onDownload: (photo: any) => void
  onShare: (photo: any) => void
}

export default function PhotoThumbnail({ 
  photo, 
  jobTitle, 
  onPreview, 
  onDownload, 
  onShare 
}: PhotoThumbnailProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const hasGPS = photo.metadata?.gps?.latitude && photo.metadata?.gps?.longitude

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden hover:border-green-500/50 transition-colors group">
      <div className="relative aspect-square">
        <img
          src={photo.file_url}
          alt={`${photo.type} photo`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPreview(photo)}
              className="bg-white/10 backdrop-blur text-white hover:bg-white/20"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDownload(photo)}
              className="bg-white/10 backdrop-blur text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onShare(photo)}
              className="bg-white/10 backdrop-blur text-white hover:bg-white/20"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            photo.type === 'before' 
              ? 'bg-blue-600/80 text-blue-100' 
              : 'bg-green-600/80 text-green-100'
          }`}>
            {photo.type}
          </span>
        </div>

        {hasGPS && (
          <div className="absolute top-2 right-2">
            <MapPin className="w-4 h-4 text-green-400" />
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        {jobTitle && (
          <h4 className="text-sm font-medium text-white truncate">
            {jobTitle}
          </h4>
        )}
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          {formatDate(photo.uploaded_at)}
        </div>

        {photo.metadata?.deviceInfo && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Smartphone className="w-3 h-3" />
            Mobile
          </div>
        )}
      </div>
    </div>
  )
}