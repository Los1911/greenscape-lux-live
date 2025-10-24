import React, { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { StatusChip, formatFriendlyDate, formatMoney } from "@/components/SharedUI"
import { useToast } from "@/hooks/use-toast"
import { Job } from "@/types/job"

type JobDrawerProps = {
  job: Job
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function JobDrawer({ job, isOpen, onClose, onUpdate }: JobDrawerProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState(job.notes || "")
  const [uploading, setUploading] = useState<"before" | "after" | null>(null)
  const [updating, setUpdating] = useState(false)

  const handleStartJob = async () => {
    setUpdating(true)
    try {
      const { error } = await supabase.from("jobs")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", job.id).select().single()
      if (error) throw error
      toast({ title: "Job started successfully" })
      onUpdate()
    } catch (error) {
      toast({ title: "Failed to start job", variant: "destructive" })
    } finally { setUpdating(false) }
  }

  const handleCompleteJob = async () => {
    setUpdating(true)
    try {
      const { error } = await supabase.from("jobs")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", job.id).select().single()
      if (error) throw error
      toast({ title: "Job completed successfully" })
      onUpdate()
    } catch (error) {
      toast({ title: "Failed to complete job", variant: "destructive" })
    } finally { setUpdating(false) }
  }

  const handlePhotoUpload = async (file: File, slot: "before" | "after") => {
    setUploading(slot)
    try {
      const path = `jobs/${job.id}/${slot}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from("job-photos").upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: publicUrl } = supabase.storage.from("job-photos").getPublicUrl(path)
      const column = slot === "before" ? "before_photo_url" : "after_photo_url"
      const { error: updateError } = await supabase.from("jobs")
        .update({ [column]: publicUrl.publicUrl }).eq("id", job.id)
      if (updateError) throw updateError
      toast({ title: `${slot} photo uploaded successfully` })
      onUpdate()
    } catch (error) {
      toast({ title: `Failed to upload ${slot} photo`, variant: "destructive" })
    } finally { setUploading(null) }
  }

  if (!isOpen) return null

  return (
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
            📍 {job.service_address || "Address TBA"}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-emerald-200/70">
              {formatFriendlyDate(job.preferred_date)}
            </div>
            <div className="text-emerald-400 font-semibold">
              {formatMoney(job.price || 0)}
            </div>
          </div>
          <div className="flex gap-2">
            {job.status !== "in_progress" && job.status !== "completed" && (
              <Button onClick={handleStartJob} disabled={updating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500">Start Job</Button>
            )}
            {job.status !== "completed" && (
              <Button onClick={handleCompleteJob} disabled={updating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500">Mark Complete</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}