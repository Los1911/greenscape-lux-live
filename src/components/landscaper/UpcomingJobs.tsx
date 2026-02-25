import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, Play, CheckCircle, AlertTriangle } from "lucide-react"
import { Job } from "@/types/job"
import PhotoUploadModal from "./PhotoUploadModal"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/SharedUI/Toast"


interface UpcomingJobsProps {
  jobs: Job[]
  loading: boolean
  onStartJob: (jobId: string) => Promise<void>
  onCompleteJob: (jobId: string) => Promise<void>
  onChanged?: () => void
  onOptimisticUpdate?: (jobId: string, updates: Partial<Job>) => void
}

export default function UpcomingJobs({ 
  jobs, 
  loading, 
  onStartJob, 
  onCompleteJob, 
  onChanged,
  onOptimisticUpdate 
}: UpcomingJobsProps) {
  const { showToast } = useToast()
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [actionLoading, setActionLoading] = useState<string>("")
  const [gpsAvailable, setGpsAvailable] = useState<boolean | null>(null)
  // Local state for optimistic updates when parent doesn't provide handler
  const [localJobs, setLocalJobs] = useState<Job[]>(jobs)

  // Sync local jobs with props
  useEffect(() => {
    setLocalJobs(jobs)
  }, [jobs])

  // Check GPS availability on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsAvailable(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => setGpsAvailable(true),
      () => setGpsAvailable(false),
      { timeout: 5000, maximumAge: 60000 }
    )
  }, [])

  // Helper for optimistic updates
  const applyOptimisticUpdate = (jobId: string, updates: Partial<Job>) => {
    if (onOptimisticUpdate) {
      onOptimisticUpdate(jobId, updates)
    } else {
      // Fallback: update local state
      setLocalJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, ...updates } : job
      ))
    }
  }

  // Manual job start - GPS is NOT required
  const handleStartJob = async (jobId: string) => {
    if (actionLoading) return
    setActionLoading(jobId)
    
    const startedAt = new Date().toISOString()
    const startMethod = gpsAvailable ? 'manual_with_gps' : 'manual_override'
    
    try {
      // Direct update - GPS/geofencing is optional, not required
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'active',

          started_at: startedAt,
          start_method: startMethod
        })
        .eq('id', jobId)

      if (error) {
        console.error('[StartJob] fail', { jobId, code: error?.code, message: error?.message })
        if (error.code === 'PGRST301') {
          showToast('Not permitted to modify this job', 'error')
        } else {
          showToast(error.message || 'Could not start job', 'error')
        }
        return
      }
      
      // OPTIMISTIC UI UPDATE: Update immediately after successful DB update
      applyOptimisticUpdate(jobId, {
        status: 'active',

        started_at: startedAt,
        start_method: startMethod
      } as Partial<Job>)
      
      showToast('Job started successfully', 'success')
      
      // Non-blocking parent refresh
      onStartJob(jobId).catch(err => {
        console.warn('[UpcomingJobs] Parent refresh after start failed:', err)
      })
      onChanged?.()
    } catch (error: any) {
      console.error('[StartJob] fail', { jobId, code: error?.code, message: error?.message })
      showToast('Could not start job', 'error')
    } finally {
      setActionLoading("")
    }
  }

  // Complete job - opens photo modal OR completes directly
  const handleCompleteJob = async (jobId: string) => {
    if (actionLoading) return
    setSelectedJobId(jobId)
    setPhotoModalOpen(true)
  }

  // Direct completion without photos (fallback for when photo upload fails)
  // CRITICAL FIX: Optimistic UI update + non-blocking refetch
  const handleDirectComplete = async (jobId: string) => {
    if (actionLoading) return
    setActionLoading(jobId)
    
    const completedAt = new Date().toISOString()
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'completed',
          completed_at: completedAt,
          completion_method: 'manual_override'
        })
        .eq('id', jobId)

      if (error) {
        console.error('[CompleteJob] fail', { jobId, code: error?.code, message: error?.message })
        showToast(error.message || 'Could not complete job', 'error')
        return
      }
      
      // OPTIMISTIC UI UPDATE: Update immediately after successful DB update
      applyOptimisticUpdate(jobId, {
        status: 'completed',
        completed_at: completedAt,
        completion_method: 'manual_override'
      } as Partial<Job>)
      
      showToast('Job completed successfully', 'success')
      
      // Non-blocking parent refresh - don't await
      onCompleteJob(jobId).catch(err => {
        console.warn('[UpcomingJobs] Parent refresh after complete failed:', err)
      })
      onChanged?.()
    } catch (error: any) {
      console.error('[CompleteJob] fail', { jobId, message: error?.message })
      showToast('Could not complete job', 'error')
    } finally {
      setActionLoading("")
    }
  }

  const handlePhotoUploadSuccess = async () => {
    if (selectedJobId) {
      // Optimistic update for photo completion
      applyOptimisticUpdate(selectedJobId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_method: 'photo_verified'
      } as Partial<Job>)
      
      // Non-blocking parent refresh
      onCompleteJob(selectedJobId).catch(err => {
        console.warn('[UpcomingJobs] Parent refresh after photo complete failed:', err)
      })
      setSelectedJobId("")
      onChanged?.()
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: "bg-blue-500/20 text-blue-400 border-blue-500",
      assigned: "bg-blue-500/20 text-blue-400 border-blue-500",
      active: "bg-yellow-500/20 text-yellow-400 border-yellow-500",

      completed: "bg-green-500/20 text-green-400 border-green-500"
    }
    return variants[status as keyof typeof variants] || variants.scheduled
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Use local jobs for rendering (supports optimistic updates)
  const displayJobs = localJobs

  if (loading) {
    return (
      <Card className="bg-black border-green-500 shadow-lg shadow-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-700 rounded-lg p-4">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-black border-green-500 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Jobs ({displayJobs.length})
            {gpsAvailable === false && (
              <Badge variant="outline" className="ml-2 text-orange-400 border-orange-400/50">
                <AlertTriangle className="w-3 h-3 mr-1" />
                GPS Off
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayJobs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No upcoming jobs</p>
              <p className="text-sm text-gray-500 mt-1">New jobs will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayJobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-700 rounded-lg p-4 hover:border-green-500/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">
                        {job.service_name}
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="w-4 h-4 text-green-400" />
                          {job.service_address}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4 text-green-400" />
                          {formatDate(job.preferred_date || "")}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getStatusBadge(job.status || "")} border ml-2`}>
                      {(job.status || "scheduled").replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-400">
                      ${job.price?.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      {/* Start button for scheduled/assigned jobs - GPS NOT required */}
                      {(job.status === "scheduled" || job.status === "assigned") && (
                        <Button
                          onClick={() => handleStartJob(job.id)}
                          disabled={actionLoading === job.id}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {actionLoading === job.id ? "Starting..." : "Start Job"}
                        </Button>
                      )}
                      {/* Complete button for active jobs - GPS NOT required */}
                      {job.status === "active" && (

                        <>
                          <Button
                            onClick={() => handleCompleteJob(job.id)}
                            disabled={actionLoading === job.id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {actionLoading === job.id ? "..." : "Complete"}
                          </Button>
                          {/* Fallback complete button when photos can't be uploaded */}
                          <Button
                            onClick={() => handleDirectComplete(job.id)}
                            disabled={actionLoading === job.id}
                            size="sm"
                            variant="outline"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                            title="Complete without photos"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PhotoUploadModal
        isOpen={photoModalOpen}
        onClose={() => {
          setPhotoModalOpen(false)
          setSelectedJobId("")
        }}
        jobId={selectedJobId}
        onSuccess={handlePhotoUploadSuccess}
        onError={(message) => console.error('Photo upload error:', message)}
      />
    </>
  )
}
