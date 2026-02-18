import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  RefreshCw,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'

import { MessageNotificationBadge } from '@/components/messaging/MessageNotificationBadge'
import JobDetailsModal from '@/components/JobDetailsModal'
import { JOBS_COLUMNS, safeString, safeNumber } from '@/lib/databaseSchema'
import { Job } from '@/types/job'

interface LocalJob {
  id: string
  service_type?: string
  service_name?: string
  service_address?: string
  preferred_date?: string
  scheduled_date?: string
  status: string
  price?: number
  landscaper_id?: string
  created_at?: string
  updated_at?: string
  user_id?: string
  client_email?: string
  customer_name?: string
}

function normalizeJobData(raw: Record<string, unknown>): LocalJob {
  return {
    id: safeString(raw, 'id'),
    service_type: safeString(raw, 'service_type'),
    service_name: safeString(raw, 'service_name'),
    service_address: safeString(raw, 'service_address'),
    preferred_date: safeString(raw, 'preferred_date'),
    scheduled_date: safeString(raw, 'scheduled_date'),
    status: safeString(raw, 'status', 'pending'),
    price: safeNumber(raw, 'price'),
    landscaper_id: safeString(raw, 'landscaper_id'),
    created_at: safeString(raw, 'created_at'),
    updated_at: safeString(raw, 'updated_at'),
    user_id: safeString(raw, 'user_id'),
    client_email: safeString(raw, 'client_email'),
    customer_name: safeString(raw, 'customer_name'),
  }
}

function JobStatusIndicator({ status }: { status: string }) {
  switch (status) {
    case 'pending':
    case 'quoted':
      return <Badge className="bg-slate-500/20 text-slate-400">Requested</Badge>

    case 'priced':
      return <Badge className="bg-emerald-500/20 text-emerald-400">Estimate Ready</Badge>

    case 'scheduled':
      return <Badge className="bg-blue-500/20 text-blue-400">Scheduled</Badge>

    case 'assigned':
      return <Badge className="bg-blue-500/20 text-blue-400">Assigned</Badge>

    case 'active':
      return <Badge className="bg-amber-500/20 text-amber-400">Active</Badge>

    case 'completed':
    case 'completed_pending_review':
      return <Badge className="bg-emerald-500/20 text-emerald-400">Completed</Badge>

    case 'cancelled':
      return <Badge className="bg-slate-600/20 text-slate-500">Cancelled</Badge>

    default:
      return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>
  }
}

export default function MyJobsSection() {
  const { user } = useAuth()

  const [jobs, setJobs] = useState<LocalJob[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const [actionJobId, setActionJobId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadJobs = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setActionError(null)

    const { data, error } = await supabase
      .from('jobs')
      .select(JOBS_COLUMNS.clientView)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Load jobs error:', error)
      setLoading(false)
      return
    }

    const normalized = (data || []).map((row: any) => normalizeJobData(row))
    setJobs(normalized)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const pricedJobs = useMemo(
    () => jobs.filter(j => j.status === 'priced'),
    [jobs]
  )

  const otherJobs = useMemo(
    () => jobs.filter(j => j.status !== 'priced'),
    [jobs]
  )

  const handleAcceptEstimate = async (job: LocalJob) => {
    if (!user?.id || actionJobId) return

    setActionJobId(job.id)
    setActionError(null)

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            job_id: job.id,
            price: job.price,
            client_user_id: user.id,
          },
        }
      )

      if (error) throw error
      if (!data?.url) throw new Error('No checkout URL returned')

      window.location.href = data.url
    } catch (err: any) {
      console.error('Checkout error:', err)
      setActionError(err.message || 'Failed to start checkout')
    } finally {
      setActionJobId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center p-8">
          <RefreshCw className="animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between">
          <CardTitle className="flex items-center gap-2">
            My Jobs
            <MessageNotificationBadge />
          </CardTitle>

          <button
            onClick={loadJobs}
            className="text-emerald-300 hover:text-emerald-200 text-sm flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </CardHeader>

        <CardContent>

          {actionError && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-900/20 px-3 py-2 text-red-300">
              <AlertCircle className="h-4 w-4" />
              {actionError}
            </div>
          )}

          {pricedJobs.length > 0 && (
            <div className="space-y-3 mb-6">
              <div className="text-emerald-400 text-sm font-semibold">
                Estimates Ready — Action Required
              </div>

              {pricedJobs.map(job => (
                <div
                  key={job.id}
                  className="rounded-lg border border-emerald-500/20 bg-black/30 p-4"
                >
                  <div className="flex justify-between mb-2">
                    <div>
                      <div className="text-emerald-100 font-medium">
                        {job.service_name || job.service_type || 'Service'}
                      </div>
                      <div className="text-xs text-slate-300">
                        {job.service_address}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-emerald-200 font-semibold">
                        ${job.price?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-xs text-slate-400">
                        Estimate
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <JobStatusIndicator status={job.status} />

                    <button
                      onClick={() => handleAcceptEstimate(job)}
                      disabled={actionJobId === job.id}
                      className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-black px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      {actionJobId === job.id ? 'Processing…' : 'Accept Estimate'}
                      <ChevronRight className="inline-block h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {otherJobs.map(job => (
            <div
              key={job.id}
              className="mb-3 rounded-lg border border-emerald-500/10 bg-black/20 p-4"
            >
              <div className="flex justify-between">
                <div>
                  <div className="text-emerald-100 font-medium">
                    {job.service_name || job.service_type || 'Service'}
                  </div>
                  <div className="text-xs text-slate-300">
                    {job.service_address}
                  </div>
                </div>

                <JobStatusIndicator status={job.status} />
              </div>
            </div>
          ))}

          {jobs.length === 0 && (
            <div className="text-slate-400 text-sm">
              No jobs yet.
            </div>
          )}

        </CardContent>
      </Card>

      <JobDetailsModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        job={selectedJob}
      />
    </>
  )
}
