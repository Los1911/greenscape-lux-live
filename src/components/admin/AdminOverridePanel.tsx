import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  JOB_STATUS_VALUES,
  JOB_STATUS_LABELS,
  toJobStatus,
  type JobStatus,
} from '@/constants/jobStatus'
import { AlertTriangle, CheckCircle, Loader2, ShieldAlert } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface OverrideJob {
  id: string
  status?: string | null
  price?: number | null
  assigned_to?: string | null
  service_type?: string | null
  service_name?: string | null
  client_email?: string | null
  created_at?: string | null
  [key: string]: unknown
}

interface Landscaper {
  id: string
  user_id: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
}

export interface AdminOverridePanelProps {
  selectedJob: OverrideJob | null
  refreshJobs: () => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminOverridePanel({ selectedJob, refreshJobs }: AdminOverridePanelProps) {
  // ── If no job selected, render nothing ──────────────────────────────
  if (!selectedJob) return null

  // ── Form state ──────────────────────────────────────────────────────
  const [newStatus, setNewStatus] = useState<string>('')
  const [newPrice, setNewPrice] = useState<string>('')
  const [newLandscaperId, setNewLandscaperId] = useState<string>('')
  const [reason, setReason] = useState<string>('')

  // ── UI state ────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── Landscaper list (for dropdown) ──────────────────────────────────
  const [landscapers, setLandscapers] = useState<Landscaper[]>([])
  const [landscapersLoading, setLandscapersLoading] = useState(false)

  // ── Reset form when job changes ─────────────────────────────────────
  useEffect(() => {
    setNewStatus('')
    setNewPrice('')
    setNewLandscaperId('')
    setReason('')
    setSuccessMsg(null)
    setErrorMsg(null)
  }, [selectedJob.id])

  // ── Load approved landscapers on mount ──────────────────────────────
  useEffect(() => {
    loadLandscapers()
  }, [])

  async function loadLandscapers() {
    try {
      setLandscapersLoading(true)
      const { data, error } = await supabase
        .from('landscapers')
        .select('id, user_id, first_name, last_name, email')
        .eq('approved', true)
        .order('first_name', { ascending: true })

      if (error) {
        console.error('[ADMIN_OVERRIDE] Failed to load landscapers:', error)
        return
      }
      setLandscapers(data || [])
    } catch (err) {
      console.error('[ADMIN_OVERRIDE] Landscaper load exception:', err)
    } finally {
      setLandscapersLoading(false)
    }
  }

  // ── Submit override ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)

    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      setErrorMsg('Override reason is required')
      return
    }

    // Validate price if provided
    if (newPrice && (isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0)) {
      setErrorMsg('Price must be a valid positive number')
      return
    }

    // ── Strict cast: status must be a valid JobStatus or null ────────
    const castStatus: JobStatus | null = newStatus ? toJobStatus(newStatus) : null
    if (newStatus && !castStatus) {
      setErrorMsg(`Invalid status value: "${newStatus}". Must be one of the canonical statuses.`)
      return
    }

    // Build nullable params
    const params: Record<string, unknown> = {
      p_job_id: selectedJob.id,
      p_reason: trimmedReason,
      p_new_status: castStatus,
      p_new_price: newPrice ? parseFloat(newPrice) : null,
      p_new_landscaper_id: newLandscaperId || null,
    }

    try {
      setSubmitting(true)
      console.log('[ADMIN_OVERRIDE] Submitting override:', params)

      const { data, error } = await supabase.rpc('admin_override_job', params)

      if (error) {
        console.error('[ADMIN_OVERRIDE] RPC error:', error)
        setErrorMsg(`Override failed: ${error.message}`)
        return
      }

      // The RPC returns a JSONB object
      const result = data as { success: boolean; error?: string } | null
      if (result && !result.success) {
        setErrorMsg(result.error || 'Override failed — unknown error')
        return
      }

      console.log('[ADMIN_OVERRIDE] Override succeeded:', result)
      setSuccessMsg('Job override applied successfully')

      // Reset form fields (keep the job selected)
      setNewStatus('')
      setNewPrice('')
      setNewLandscaperId('')
      setReason('')

      // Trigger parent refresh
      try {
        refreshJobs()
      } catch (refreshErr) {
        console.warn('[ADMIN_OVERRIDE] refreshJobs callback error (non-fatal):', refreshErr)
      }
    } catch (err: any) {
      console.error('[ADMIN_OVERRIDE] Unhandled exception:', err)
      setErrorMsg(`Unexpected error: ${err?.message || 'Unknown'}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  function landscaperLabel(l: Landscaper): string {
    const name = [l.first_name, l.last_name].filter(Boolean).join(' ')
    return name ? `${name} (${l.email || 'no email'})` : l.email || l.id.slice(0, 8)
  }

  const currentStatusDisplay = selectedJob.status
    ? JOB_STATUS_LABELS[selectedJob.status as JobStatus] || selectedJob.status
    : 'N/A'

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="bg-black/40 backdrop-blur border border-amber-500/20 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-amber-300">Admin Override</h3>
      </div>

      <p className="text-xs text-gray-400">
        Force-update this job's status, price, or assigned landscaper. All overrides are audited.
      </p>

      {/* Override Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current job info */}
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-xs text-gray-400 space-y-1">
          <div>
            <span className="text-gray-500">Job ID:</span>{' '}
            <span className="text-gray-300 font-mono">{selectedJob.id}</span>
          </div>
          <div>
            <span className="text-gray-500">Current Status:</span>{' '}
            <span className="text-white">{currentStatusDisplay}</span>
          </div>
          {selectedJob.price != null && (
            <div>
              <span className="text-gray-500">Current Price:</span>{' '}
              <span className="text-white">${Number(selectedJob.price).toFixed(2)}</span>
            </div>
          )}
          {selectedJob.assigned_to && (
            <div>
              <span className="text-gray-500">Assigned To:</span>{' '}
              <span className="text-white font-mono">{String(selectedJob.assigned_to).slice(0, 8)}…</span>
            </div>
          )}
        </div>

        {/* Status dropdown — dynamically mapped from JOB_STATUS_VALUES */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">
            New Status <span className="text-gray-500">(optional)</span>
          </label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            disabled={submitting}
            className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-lg text-sm text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none disabled:opacity-50"
          >
            <option value="">— Keep current status —</option>
            {JOB_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {JOB_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Price input */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">
            New Price <span className="text-gray-500">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Leave blank to keep current"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              disabled={submitting}
              className="w-full pl-7 pr-4 py-2 bg-black/60 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Landscaper dropdown */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">
            Assign Landscaper <span className="text-gray-500">(optional)</span>
          </label>
          <select
            value={newLandscaperId}
            onChange={(e) => setNewLandscaperId(e.target.value)}
            disabled={submitting || landscapersLoading}
            className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-lg text-sm text-white focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none disabled:opacity-50"
          >
            <option value="">— Keep current assignment —</option>
            {landscapers.map((l) => (
              <option key={l.id} value={l.user_id || l.id}>
                {landscaperLabel(l)}
              </option>
            ))}
          </select>
          {landscapersLoading && (
            <p className="text-xs text-gray-500">Loading landscapers…</p>
          )}
        </div>

        {/* Override reason (REQUIRED) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">
            Override Reason <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Explain why this override is necessary…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            className="w-full px-3 py-2 bg-black/60 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 outline-none resize-none disabled:opacity-50"
          />
          {reason.trim() === '' && (
            <p className="text-xs text-gray-500">Required — override will not submit without a reason.</p>
          )}
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-emerald-300">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Error alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || reason.trim() === ''}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg text-sm transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Applying Override…
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4" />
              Apply Override
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default AdminOverridePanel
