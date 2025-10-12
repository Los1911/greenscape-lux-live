import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, Play, CheckCircle, Camera } from "lucide-react"
import { Job } from "@/types/job"
import PhotoUploadModal from "./PhotoUploadModal"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/SharedUI/Toast"
import { Jobs } from "@/db/contracts"


interface UpcomingJobsProps {
  jobs: Job[]
  loading: boolean
  onStartJob: (jobId: string) => Promise<void>
  onCompleteJob: (jobId: string) => Promise<void>
  onChanged?: () => void
}

export default function UpcomingJobs({ jobs, loading, onStartJob, onCompleteJob, onChanged }: UpcomingJobsProps) {
  const { showToast } = useToast()
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [actionLoading, setActionLoading] = useState<string>("")

  const handleStartJob = async (jobId: string) => {
    if (actionLoading) return
    setActionLoading(jobId)
    try {
      const { error, data, count } = await Jobs.start(supabase, jobId)
      
      if (error) {
        console.error('[StartJob] fail', { jobId, code: error?.code, message: error?.message })
        if (error.code === 'PGRST301' || count === 0) {
          showToast('Not permitted to modify this job', 'error')
        } else {
          showToast(error.message || 'Could not start job', 'error')
        }
        return
      }
      
      showToast('Job started', 'success')
      await onStartJob(jobId) // Refresh parent data
      onChanged?.() // Trigger earnings refresh
    } catch (error: any) {
      console.error('[StartJob] fail', { jobId, code: error?.code, message: error?.message })
      showToast('Could not start job', 'error')
    } finally {
      setActionLoading("")
    }
  }

  const handleCompleteJob = async (jobId: string) => {
    if (actionLoading) return
    setSelectedJobId(jobId)
    setPhotoModalOpen(true)
  }



  const handlePhotoUploadSuccess = async () => {
    if (selectedJobId) {
      await onCompleteJob(selectedJobId)
      setSelectedJobId("")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: "bg-blue-500/20 text-blue-400 border-blue-500",
      in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
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
            Upcoming Jobs ({jobs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No upcoming jobs</p>
              <p className="text-sm text-gray-500 mt-1">New jobs will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
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
                    <Badge className={`${getStatusBadge(job.status || "")} border ml-2`}>
                      {(job.status || "scheduled").replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-400">
                      ${job.price?.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      {job.status === "scheduled" && (
                        <Button
                          onClick={() => handleStartJob(job.id)}
                          disabled={actionLoading === job.id}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {actionLoading === job.id ? "Starting..." : "Start"}
                        </Button>
                      )}
                      {job.status === "in_progress" && (
                        <Button
                          onClick={() => handleCompleteJob(job.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
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
