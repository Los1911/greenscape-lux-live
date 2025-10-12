import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/SharedUI/Toast"
import { supabase } from "@/lib/supabase"
import { Images, Download, Share2, RefreshCw } from "lucide-react"
import PhotoThumbnail from "./PhotoThumbnail"
import PhotoFilters from "./PhotoFilters"
import PhotoPreviewModal from "./PhotoPreviewModal"
import { Job } from "@/types/job"

interface Photo {
  id: string
  file_url: string
  type: 'before' | 'after'
  uploaded_at: string
  job_id: string
  metadata?: {
    gps?: { latitude: number; longitude: number }
    deviceInfo?: { userAgent: string; timestamp: number; timezone?: string }
  }
}


export default function PhotoGallery() {
  const { showToast } = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [filters, setFilters] = useState<{
    jobId?: string
    type?: 'before' | 'after' | 'all'
    dateRange?: { start: string; end: string }
    searchTerm?: string
  }>({})

  useEffect(() => {
    fetchPhotosAndJobs()
  }, [])

  const fetchPhotosAndJobs = async () => {
    setLoading(true)
    try {
      // Fetch photos with job info
      const { data: photosData, error: photosError } = await supabase
        .from('job_photos')
        .select(`
          *,
          jobs!inner(id, service_name, client_id, landscaper_id)
        `)
        .order('uploaded_at', { ascending: false })
      if (photosError) throw photosError

      // Filter photos for current landscaper
      const { data: { user } } = await supabase.auth.getUser()
      const filteredPhotos = photosData?.filter((photo: any) => 
        photo.jobs.landscaper_id === user?.id
      ) || []

      setPhotos(filteredPhotos.map((photo: any) => ({
        id: photo.id,
        file_url: photo.file_url,
        type: photo.type,
        uploaded_at: photo.uploaded_at,
        job_id: photo.job_id,
        metadata: photo.metadata,
        jobTitle: photo.jobs.service_name
      })))

      // Extract unique jobs - map to partial Job objects with required fields
      const uniqueJobs = Array.from(
        new Map(filteredPhotos.map((photo: any) => [
          photo.jobs.id, 
          { 
            id: photo.jobs.id, 
            service_name: photo.jobs.service_name,
            service_type: null,
            service_address: null,
            price: null,
            preferred_date: null,
            status: 'pending',
            customer_name: '',
            created_at: '',
            updated_at: ''
          } as Job
        ])).values()
      )
      setJobs(uniqueJobs)


    } catch (error: any) {
      console.error('Error fetching photos:', error)
      showToast('Failed to load photos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredPhotos = photos.filter(photo => {
    if (filters.jobId && photo.job_id !== filters.jobId) return false
    if (filters.type && filters.type !== 'all' && photo.type !== filters.type) return false
    
    if (filters.dateRange?.start || filters.dateRange?.end) {
      const photoDate = new Date(photo.uploaded_at)
      if (filters.dateRange.start && photoDate < new Date(filters.dateRange.start)) return false
      if (filters.dateRange.end && photoDate > new Date(filters.dateRange.end)) return false
    }
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const jobServiceName = jobs.find(j => j.id === photo.job_id)?.service_name || ''
      if (!jobServiceName.toLowerCase().includes(searchLower) && 
          !photo.type.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    
    return true
  })


  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(photo.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${photo.type}_photo_${photo.job_id}_${new Date(photo.uploaded_at).toISOString().split('T')[0]}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showToast('Photo downloaded', 'success')
    } catch (error) {
      showToast('Failed to download photo', 'error')
    }
  }

  const handleShare = async (photo: Photo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${photo.type} Photo`,
          text: `Job completion photo - ${photo.type}`,
          url: photo.file_url
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(photo.file_url)
        showToast('Photo URL copied to clipboard', 'success')
      } catch (error) {
        showToast('Failed to copy URL', 'error')
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Images className="w-6 h-6" />
            Photo Gallery
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchPhotosAndJobs}
              disabled={loading}
              className="ml-auto text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PhotoFilters
            filters={filters}
            onFiltersChange={setFilters}
            jobs={jobs}
          />

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredPhotos.length > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <p className="text-gray-400 text-sm">
                  {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map(photo => (
                  <PhotoThumbnail
                    key={photo.id}
                    photo={photo}
                    jobTitle={jobs.find(j => j.id === photo.job_id)?.service_name}
                    onPreview={setSelectedPhoto}
                    onDownload={handleDownload}
                    onShare={handleShare}
                  />
                ))}

              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Images className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No photos found</h3>
              <p className="text-sm">
                {Object.keys(filters).length > 0 
                  ? 'Try adjusting your filters to see more photos'
                  : 'Upload your first job completion photos to see them here'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PhotoPreviewModal
        photo={selectedPhoto}
        jobTitle={selectedPhoto ? jobs.find(j => j.id === selectedPhoto.job_id)?.service_name : undefined}
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDownload={handleDownload}
        onShare={handleShare}
      />

    </div>
  )
}