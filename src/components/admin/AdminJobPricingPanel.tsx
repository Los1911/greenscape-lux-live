import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, AlertCircle } from 'lucide-react'

/* ================= TYPES ================= */

interface Job {
  id: string
  service_name: string | null
  client_email: string | null
  price: number | null
  priced_at: string | null
  priced_by: string | null
  status: string | null
  admin_notes: string | null
  created_at: string
}

/* ================= COMPONENT ================= */

export default function AdminJobPricingPanel() {
  const { toast } = useToast()

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const [priceInput, setPriceInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [saving, setSaving] = useState(false)

  /* ================= LOAD JOBS ================= */

  const loadJobs = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id,
        service_name,
        client_email,
        price,
        priced_at,
        priced_by,
        status,
        admin_notes,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Failed to load jobs', description: error.message, variant: 'destructive' })
    } else {
      setJobs(data || [])
    }

    setLoading(false)
  }, [toast])

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

  /* ================= SAVE PRICE ================= */

  const handleSavePrice = async () => {
    if (!selectedJob) return

    const price = Number(priceInput)
    if (!price || price <= 0) {
      toast({ title: 'Invalid price', variant: 'destructive' })
      return
    }

    setSaving(true)

    try {
      const { data: auth } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('jobs')
        .update({
          price,
          priced_at: new Date().toISOString(),
          priced_by: auth.user?.id ?? null,
          admin_notes: notesInput || null,
          status: 'scheduled' // 🔥 THIS WAS MISSING
        })
        .eq('id', selectedJob.id)

      if (error) throw error

      toast({ title: 'Price saved', description: `$${price.toFixed(2)} applied` })

      setSelectedJob(null)
      setPriceInput('')
      setNotesInput('')
      loadJobs()
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  /* ================= FILTERS ================= */

  const pricingJobs = jobs.filter(j => j.price === null || j.priced_at === null)

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="pricing">
      <TabsList>
        <TabsTrigger value="pricing">Needs Pricing ({pricingJobs.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pricing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Needs Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pricingJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job)
                    setPriceInput(job.price?.toString() || '')
                    setNotesInput(job.admin_notes || '')
                  }}
                  className="w-full text-left p-3 rounded border border-gray-700 hover:bg-gray-800"
                >
                  <div className="font-medium">{job.service_name || 'Unnamed Service'}</div>
                  <div className="text-xs text-gray-500">{job.client_email}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedJob ? (
                <div className="text-center text-gray-500 py-10">
                  Select a job to set pricing
                </div>
              ) : (
                <>
                  <label className="text-sm text-gray-400">Price ($)</label>
                  <Input
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
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
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? 'Saving...' : 'Save Price'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
