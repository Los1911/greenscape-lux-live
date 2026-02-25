import React, { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { StatusChip, formatFriendlyDate, formatMoney } from "@/components/SharedUI"
import { useToast } from "@/hooks/use-toast"
import { Job } from "@/types/job"
import { MessageCircle } from "lucide-react"
import { StructuredJobMessaging } from "@/components/messaging/StructuredJobMessaging"

type JobDrawerProps = {
  job: Job
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  onOptimisticUpdate?: (updates: Partial<Job>) => void
}

export function JobDrawer({ job, isOpen, onClose, onUpdate, onOptimisticUpdate }: JobDrawerProps) {
  const { toast } = useToast()
  const [updating, setUpdating] = useState(false)
  const [messagingOpen, setMessagingOpen] = useState(false)

  // Check if messaging is available for this job status
  const canMessage = job?.status === 'assigned' || job?.status === 'active' || job?.status === 'completed'

  // Manual start - GPS is optional, not required
  // CRITICAL FIX: Optimistic UI update + non-blocking refresh
  const handleStartJob = async () => {
    setUpdating(true)
    const startedAt = new Date().toISOString()
    
    try {
      const { error } = await supabase.from("jobs")
        .update({ 
          status: "active", 
          started_at: startedAt,
          start_method: 'manual_override'
        })
        .eq("id", job.id)
      
      if (error) throw error
      
      // OPTIMISTIC UI UPDATE: Update immediately
      if (onOptimisticUpdate) {
        onOptimisticUpdate({
          status: 'active',
          started_at: startedAt,
          start_method: 'manual_override'
        })
      }
      
      toast({ title: "Job started successfully" })
      
      // Non-blocking parent refresh
      try {
        onUpdate()
      } catch (refreshError) {
        console.warn('[JobDrawer] Parent refresh after start failed:', refreshError)
      }
    } catch (error) {
      toast({ title: "Failed to start job", variant: "destructive" })
    } finally { 
      setUpdating(false) 
    }
  }

  // Complete job - GPS is NOT required
  // CRITICAL FIX: Optimistic UI update + non-blocking refresh
  const handleCompleteJob = async () => {
    setUpdating(true)
    const completedAt = new Date().toISOString()
    
    try {
      const { error } = await supabase.from("jobs")
        .update({ 
          status: "completed", 
          completed_at: completedAt,
          completion_method: 'manual_override'
        })
        .eq("id", job.id)
      
      if (error) throw error
      
      // OPTIMISTIC UI UPDATE: Update immediately
      if (onOptimisticUpdate) {
        onOptimisticUpdate({
          status: 'completed',
          completed_at: completedAt,
          completion_method: 'manual_override'
        })
      }
      
      toast({ title: "Job completed successfully" })
      
      // Non-blocking parent refresh
      try {
        onUpdate()
      } catch (refreshError) {
        console.warn('[JobDrawer] Parent refresh after complete failed:', refreshError)
      }
    } catch (error) {
      toast({ title: "Failed to complete job", variant: "destructive" })
    } finally { 
      setUpdating(false) 
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md rounded-t-2xl md:rounded-2xl border border-emerald-800/40 bg-emerald-900/20 p-4 md:p-5 backdrop-blur animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 duration-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-emerald-100">Job Details</h3>
            <Button onClick={onClose} variant="ghost" size="sm">Close</Button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="font-medium text-emerald-100 truncate" title={job.service_name || ""}>
                {job.service_name || "Untitled Job"}
              </div>
              <StatusChip status={job.status || "scheduled"} />
            </div>
            <div className="text-sm text-emerald-200/70 truncate" title={job.service_address || ""}>
              {job.service_address || "Address TBA"}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-emerald-200/70">
                {formatFriendlyDate(job.preferred_date)}
              </div>
              <div className="text-emerald-400 font-semibold">
                {formatMoney(job.price || 0)}
              </div>
            </div>
            
            {/* Messaging Button */}
            {canMessage && (
              <Button
                onClick={() => setMessagingOpen(true)}
                variant="outline"
                className="w-full border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/30"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {job.status === 'completed' ? 'View Messages' : 'Message Client'}
              </Button>
            )}
            
            <div className="flex gap-2">
              {/* Manual start button - GPS is optional */}
              {job.status === 'assigned' && (
                <Button onClick={handleStartJob} disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-500">
                  {updating ? 'Starting...' : 'Start Job'}
                </Button>
              )}
              {/* Complete button - GPS NOT required */}
              {job.status === 'active' && (
                <Button onClick={handleCompleteJob} disabled={updating}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500">
                  {updating ? 'Completing...' : 'Mark Complete'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Structured Messaging Modal */}
      <StructuredJobMessaging
        jobId={job.id}
        jobStatus={job.status || 'pending'}
        isOpen={messagingOpen}
        onClose={() => setMessagingOpen(false)}
        jobTitle={job.service_name || 'Job'}
      />
    </>
  )
}
