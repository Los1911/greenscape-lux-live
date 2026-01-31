import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  FileText,
  ChevronRight,
  Save,
  Eye,
  Mail,
  Layers,
  Tag,
  Flag,
  Activity,
  CalendarCheck,
  HelpCircle,
  List
} from 'lucide-react'

/* =========================================================
   TYPES
========================================================= */

interface Job {
  id: string
  service_name?: string | null
  service_type?: string | null
  selected_services?: string[] | null
  status?: string | null
  price?: number | null
  priced_at?: string | null
  priced_by?: string | null
  assigned_to?: string | null
  landscaper_id?: string | null
  completed_at?: string | null
  flagged_at?: string | null
  client_email?: string | null
  admin_notes?: string | null
  created_at: string
}

type LifecycleStage =
  | 'pricing'
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'unclassified'

/* =========================================================
   LIFECYCLE LOGIC
========================================================= */

function deriveLifecycleStage(job?: Job | null): LifecycleStage {
  if (!job) return 'unclassified'
  if (job.completed_at) return 'completed'
  if ((job.assigned_to || job.landscaper_id) && !job.completed_at) return 'active'
  if (job.priced_at && !job.assigned_to) return 'scheduled'
  if (job.price == null || job.priced_at == null) return 'pricing'
  return 'unclassified'
}

function isJobFlagged(job?: Job | null) {
  return !!job?.flagged_at
}

function isJobEditable(job?: Job | null) {
  return deriveLifecycleStage(job) === 'pricing'
}

function getJobDisplayName(job?: Job | null) {
  return job?.service_name || job?.service_type || 'Unnamed Service'
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function AdminJobPricingPanel() {
  const { toast } = useToast()

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [activeTab, setActiveTab] = useState<LifecycleStage>('pricing')
  const [mobileOpen, setMobileOpen] = useState(false)

  /* -----------------------------
     INPUT STATE (FIXED)
  ----------------------------- */
  const [priceInput, setPriceInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [saving, setSaving] = useState(false)

  const lastJobIdRef = useRef<string | null>(null)
  const isEditingRef = useRef(false)

  /* -----------------------------
     LOAD JOBS
  ----------------------------- */
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          service_name,
          service_type,
          selected_services,
          status,
          price,
          priced_at,
          priced_by,
          assigned_to,
          landscaper_id,
          completed_at,
          flagged_at,
          client_email,
          admin_notes,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!isEditingRef.current) {
        setJobs(data || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()

    const channel = supabase
      .channel('admin-jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, loadJobs)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadJobs])

  /* -----------------------------
     INITIALIZE INPUTS ON JOB CHANGE
  ----------------------------- */
  useEffect(() => {
    const id = selectedJob?.id || null
    if (id !== lastJobIdRef.current) {
      lastJobIdRef.current = id
      setPriceInput(selectedJob?.price?.toString() || '')
      setNotesInput(selectedJob?.admin_notes || '')
    }
  }, [selectedJob?.id])

  /* -----------------------------
     SAVE PRICE
  ----------------------------- */
  const handleSavePrice = async () => {
    if (!selectedJob) return

    const price = Number(priceInput)
    if (isNaN(price) || price <= 0) return

    setSaving(true)
    try {
      const { data } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('jobs')
        .update({
          price,
          priced_at: new Date().toISOString(),
          priced_by: data.user?.id ?? null,
          admin_notes: notesInput || null,
          status: 'priced'
        })
        .eq('id', selectedJob.id)

      if (error) throw error

      toast({ title: 'Price saved', description: `$${price.toFixed(2)} applied` })
      setSelectedJob(null)
      setMobileOpen(false)
      loadJobs()
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        {error}
        <Button onClick={loadJobs} className="mt-4">Retry</Button>
      </div>
    )
  }

  const pricingJobs = jobs.filter(j => deriveLifecycleStage(j) === 'pricing')

  return (
    <>
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as LifecycleStage)}>
        <TabsList className="mb-4">
          <TabsTrigger value="pricing">Needs Pricing ({pricingJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* JOB LIST */}
            <Card>
              <CardHeader>
                <CardTitle>Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {pricingJobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left p-3 rounded border ${
                      selectedJob?.id === job.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    <div className="font-medium">{getJobDisplayName(job)}</div>
                    <div className="text-xs text-gray-500">{job.client_email}</div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* PRICING PANEL */}
            <Card>
              <CardHeader>
                <CardTitle>Job Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedJob ? (
                  <div className="text-center text-gray-500 py-10">
                    Select a job to price
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-sm text-gray-400">
                      {getJobDisplayName(selectedJob)}
                    </div>

                    <label className="text-sm text-gray-400">Price ($)</label>
                    <Input
                      value={priceInput}
                      onFocus={() => { isEditingRef.current = true }}
                      onBlur={() => { isEditingRef.current = false }}
                      onChange={e => {
                        const val = e.target.value
                        if (/^\d*\.?\d*$/.test(val)) setPriceInput(val)
                      }}
                      placeholder="0.00"
                      className="mb-3"
                    />

                    <Textarea
                      value={notesInput}
                      onChange={e => setNotesInput(e.target.value)}
                      placeholder="Admin notes"
                      className="mb-4"
                    />

                    <Button
                      onClick={handleSavePrice}
                      disabled={saving || !priceInput}
                      className="w-full"
                    >
                      {saving ? 'Saving…' : 'Save Price'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default AdminJobPricingPanel
