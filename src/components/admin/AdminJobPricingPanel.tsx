import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw } from 'lucide-react'

interface Job {
  id: string
  service_name: string | null
  client_email: string | null
  price: number | null
  priced_at: string | null
  priced_by: string | null
  status: string | null
  admin_notes: string | null
  created_at: string | null
}

export default function AdminJobPricingPanel() {
  const { toast } = useToast()

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [saving, setSaving] = useState(false)

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
      toast({
        title: 'Failed to load jobs',
        description: error.message,
        variant: 'destructive'
      })
    } else {
      setJobs(data || [])
    }

    setLoading(false)
  }, [toast])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job)
    setPriceInput(job.price !== null && job.price !== undefined ? String(job.price) : '')
    setNotesInput(job.admin_notes ?? '')
  }

  const handleSavePrice = async () => {
    if (!selectedJob) return

    const price = Number(priceInput)

    if (!price || price <= 0) {
      toast({
        title: 'Invalid price',
        variant: 'destructive'
      })
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
          priced_by: auth?.user?.id ?? null,
          admin_notes: notesInput || null,
          status: 'quoted'
        })
        .eq('id', selectedJob.id)

      if (error) throw error

      toast({
        title: 'Quote saved',
        description: `$${price.toFixed(2)} applied`
      })

      setSelectedJob(null)
      setPriceInput('')
      setNotesInput('')
      await loadJobs()
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const pricingJobs = jobs.filter(
    j => j.status === 'pending' || j.status === 'quoted'
  )

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
        <TabsTrigger value="pricing">
          Needs Pricing ({pricingJobs.length})
        </TabsTrigger>
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
                  onClick={() => handleSelectJob(job)}
                  className="w-full text-left p-3 rounded border border-gray-700 hover:bg-gray-800"
                >
                  <div className="font-medium">
                    {job.service_name || 'Unnamed Service'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {job.client_email}
                  </div>
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
                  <label className="text-sm text-gray-400">
                    Price ($)
                  </label>
                  <Input
                    type="number"
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
                    {saving ? 'Saving...' : 'Save Quote'}
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
