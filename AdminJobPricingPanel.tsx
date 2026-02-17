
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Job = {
  id: string
  service_name: string | null
  client_email: string | null
  price: number | null
  priced_at: string | null
  status: string
}

export default function AdminJobPricingPanel() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, service_name, client_email, price, priced_at, status')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setJobs(data)
    }
  }

  async function handleSavePrice() {
    if (!selectedJob) return

    const price = Number(priceInput)
    if (isNaN(price) || price <= 0) return

    console.log('[ADMIN] Saving price', {
      jobId: selectedJob.id,
      price
    })

    setSaving(true)

    const { data: auth } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('jobs')
      .update({
        price,
        priced_at: new Date().toISOString(),
        priced_by: auth.user?.id ?? null,
        admin_notes: notesInput || null,
        status: 'scheduled'
      })
      .eq('id', selectedJob.id)

    if (error) {
      console.error('[ADMIN] Pricing failed', error)
    } else {
      console.log('[ADMIN] Pricing saved')
      setSelectedJob(null)
      setPriceInput('')
      setNotesInput('')
      await loadJobs()
    }

    setSaving(false)
  }

  const pricingJobs = jobs.filter(
    j => j.price === null || j.priced_at === null
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="mb-3 font-semibold">
          Needs Pricing ({pricingJobs.length})
        </h3>

        {pricingJobs.map(job => (
          <button
            key={job.id}
            onClick={() => setSelectedJob(job)}
            className="w-full text-left border rounded p-3 mb-2 hover:bg-muted"
          >
            <div className="font-medium">
              {job.service_name || 'Unnamed Service'}
            </div>
            <div className="text-sm opacity-70">
              {job.client_email}
            </div>
          </button>
        ))}
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Job Pricing</h3>

        {!selectedJob ? (
          <div className="opacity-60">Select a job to price</div>
        ) : (
          <>
            <Input
              placeholder="Price ($)"
              value={priceInput}
              onChange={e => setPriceInput(e.target.value)}
              className="mb-3"
            />

            <Textarea
              placeholder="Admin notes (optional)"
              value={notesInput}
              onChange={e => setNotesInput(e.target.value)}
              className="mb-4"
            />

            <Button
              type="button"
              onClick={handleSavePrice}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Saving…' : 'Save Price'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
