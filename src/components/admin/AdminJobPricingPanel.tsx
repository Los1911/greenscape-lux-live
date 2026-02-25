import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimePatch, patchArray } from '@/hooks/useRealtimePatch'
import { AdminOverridePanel } from '@/components/admin/AdminOverridePanel'
import { JOB_STATUS_VALUES, JOB_STATUS_LABELS, type JobStatus as CanonicalJobStatus } from '@/constants/jobStatus'
import {
  deriveAdminBucket,
  type AdminBucket,
  ADMIN_BUCKET_CONFIG,
} from '@/lib/jobLifecycleContract'


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
  MapPin,
  Calendar,
  FileText,
  ChevronRight,
  Save,
  Eye,
  Mail,
  Layers,
  Tag,
  Play,
  Flag,
  Activity,
  CalendarCheck,
  HelpCircle,
  List,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  XCircle,
  RotateCcw,
} from 'lucide-react'



// ============================================================================
// JOB INTERFACE - ONLY includes columns that exist in the database
// ============================================================================
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
  completed_at?: string | null
  flagged_at?: string | null
  client_email?: string | null
  landscaper_id?: string | null
  created_at: string
  admin_notes?: string | null
}


// ============================================================================
// BUCKET DERIVATION — delegates to the canonical lifecycle contract
//
// deriveAdminBucket() uses job.status as PRIMARY signal, with column-based
// fallback only for jobs with null/unknown status. This is the SINGLE SOURCE
// OF TRUTH for admin bucket classification.
// ============================================================================

/**
 * Check if a job belongs to the 'exceptions' bucket (flagged, blocked, cancelled, rescheduled)
 */
function isJobFlagged(job: Job | null | undefined): boolean {
  if (!job) return false
  // Primary: status-based via lifecycle contract
  if (deriveAdminBucket(job) === 'exceptions') return true
  // Secondary: flagged_at column as overlay indicator
  return job.flagged_at != null
}

/**
 * Check if a job can be priced (only jobs in the needs_pricing bucket)
 */
function isJobEditable(job: Job | null | undefined): boolean {
  if (!job) return false
  return deriveAdminBucket(job) === 'needs_pricing'
}

/**
 * Get display name for a job
 */
function getJobDisplayName(job: Job | null | undefined): string {
  if (!job) return 'Unknown Job'
  return job.service_name || job.service_type || 'Unnamed Service'
}

// JobStats interface — aligned with AdminBucket
interface JobStats {
  needs_pricing: number
  ready_to_release: number
  active: number
  pending_review: number
  completed: number
  exceptions: number
  unclassified: number
  total: number
}

// Status display config - built from canonical JOB_STATUS_VALUES
const STATUS_ICON_MAP: Record<string, any> = {
  pending: Clock, quoted: Clock, priced: DollarSign, available: Eye,
  assigned: User, scheduled: CalendarCheck, active: Play, pending_review: Clock,
  completed: CheckCircle, completed_pending_review: Clock, flagged_review: Flag,
  blocked: AlertCircle, cancelled: XCircle, rescheduled: RotateCcw,
  // Legacy aliases
  blocked_review: AlertCircle,
}

const STATUS_COLOR_MAP: Record<string, { color: string; bgColor: string }> = {
  pending:                    { color: 'text-amber-300',   bgColor: 'bg-amber-500/20' },
  quoted:                     { color: 'text-blue-300',    bgColor: 'bg-blue-500/20' },
  priced:                     { color: 'text-blue-300',    bgColor: 'bg-blue-500/20' },
  available:                  { color: 'text-green-300',   bgColor: 'bg-green-500/20' },
  assigned:                   { color: 'text-purple-300',  bgColor: 'bg-purple-500/20' },
  scheduled:                  { color: 'text-cyan-300',    bgColor: 'bg-cyan-500/20' },
  active:                     { color: 'text-yellow-300',  bgColor: 'bg-yellow-500/20' },
  pending_review:             { color: 'text-orange-300',  bgColor: 'bg-orange-500/20' },
  completed:                  { color: 'text-emerald-300', bgColor: 'bg-emerald-500/20' },
  completed_pending_review:   { color: 'text-orange-300',  bgColor: 'bg-orange-500/20' },
  flagged_review:             { color: 'text-red-300',     bgColor: 'bg-red-500/20' },
  rescheduled:                { color: 'text-sky-300',     bgColor: 'bg-sky-500/20' },
  blocked_review:             { color: 'text-red-300',     bgColor: 'bg-red-500/20' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = Object.fromEntries([
  ...JOB_STATUS_VALUES.map((s) => [s, {
    label: JOB_STATUS_LABELS[s],
    color: STATUS_COLOR_MAP[s]?.color  ?? 'text-gray-400',
    bgColor: STATUS_COLOR_MAP[s]?.bgColor ?? 'bg-gray-500/20',
    icon: STATUS_ICON_MAP[s] ?? HelpCircle,
  }]),
  ['blocked_review', { label: 'Blocked', color: 'text-red-300', bgColor: 'bg-red-500/20', icon: AlertCircle }],
  ['unknown', { label: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-500/20', icon: HelpCircle }],
])


function getStatusConfig(status: string | null | undefined) {
  if (!status) return STATUS_CONFIG.pending
  return STATUS_CONFIG[status] || STATUS_CONFIG.unknown
}


// ============================================================================
// BUCKET DISPLAY CONFIG — driven by ADMIN_BUCKET_CONFIG from lifecycle contract
// Extended with icons for tab rendering
// ============================================================================
const BUCKET_ICON_MAP: Record<AdminBucket, any> = {
  needs_pricing:    DollarSign,
  ready_to_release: CalendarCheck,
  active:           Activity,
  pending_review:   AlertTriangle,
  completed:        CheckCircle,
  exceptions:       Flag,
  unclassified:     HelpCircle,
}

function getBucketConfig(bucket: AdminBucket) {
  const base = ADMIN_BUCKET_CONFIG[bucket]
  return {
    ...base,
    icon: BUCKET_ICON_MAP[bucket] ?? HelpCircle,
  }
}


// Job Scope Details Component
function JobScopeDetails({ job }: { job: Job }) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3">
      <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 pb-2 border-b border-gray-700/50">
        <FileText className="w-4 h-4" />
        Job Details
      </h4>
      
      <div className="flex items-start gap-2 text-sm">
        <Tag className="w-4 h-4 text-blue-400/70 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-gray-500 text-xs block">Service</span>
          <span className="text-gray-200">{getJobDisplayName(job)}</span>
        </div>
      </div>

      {job.selected_services && job.selected_services.length > 0 && (
        <div className="flex items-start gap-2 text-sm">
          <Layers className="w-4 h-4 text-purple-400/70 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-gray-500 text-xs block mb-1">Selected Services</span>
            <div className="flex flex-wrap gap-1.5">
              {job.selected_services.map((service, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5"
                >
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {job.client_email && (
        <div className="flex items-start gap-2 text-sm">
          <Mail className="w-4 h-4 text-cyan-400/70 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-gray-500 text-xs block">Client Email</span>
            <span className="text-gray-200 break-all">{job.client_email}</span>
          </div>
        </div>
      )}

      {job.created_at && (
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="w-4 h-4 text-amber-400/70 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-gray-500 text-xs block">Created</span>
            <span className="text-gray-200">{formatDate(job.created_at)}</span>
          </div>
        </div>
      )}

      {!job.client_email && !job.selected_services?.length && (
        <div className="text-center py-2 text-gray-500 text-sm italic">
          Limited job details available
        </div>
      )}
    </div>
  )
}

// Pricing Form Component
function PricingForm({
  priceInput,
  setPriceInput,
  notesInput,
  setNotesInput,
  saving,
  onSave,
  existingPrice
}: {
  priceInput: string
  setPriceInput: (value: string) => void
  notesInput: string
  setNotesInput: (value: string) => void
  saving: boolean
  onSave: () => void
  existingPrice?: number | null
}) {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (/^\d*\.?\d*$/.test(val)) {
      setPriceInput(val)
    }
  }

  const handleSave = () => {
    const finalPrice = Number(priceInput)
    if (isNaN(finalPrice) || finalPrice <= 0) return
    onSave()
  }

  return (
    <div className="space-y-3 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30">
      <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 pb-2 border-b border-emerald-700/30">
        <DollarSign className="w-4 h-4" />
        Set Baseline Price
        {existingPrice && existingPrice > 0 && (
          <span className="text-xs text-gray-500 font-normal ml-auto">
            Current: ${existingPrice.toFixed(2)}
          </span>
        )}
      </h4>
      <div>
        <label className="text-sm text-gray-400 mb-1.5 block">Price ($)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={handlePriceChange}
            placeholder="0.00"
            className="bg-gray-800/50 border-gray-700 pl-9 text-lg font-medium"
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1.5 italic">
          This is a starting price. Final pricing may adjust after landscaper review.
        </p>
      </div>
      <div>
        <label className="text-sm text-gray-400 mb-1.5 block">Admin Notes (optional)</label>
        <Textarea
          value={notesInput}
          onChange={e => setNotesInput(e.target.value)}
          placeholder="Baseline starting price. Final may vary based on bed size, plants, mulch, and build type."
          className="bg-gray-800/50 border-gray-700 min-h-[80px] text-sm resize-none"
        />
      </div>
      <Button 
        onClick={handleSave} 
        disabled={saving || !priceInput || Number(priceInput) <= 0}
        className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-medium"
      >
        {saving ? (
          <RefreshCw className="mr-2 w-4 h-4 animate-spin" />
        ) : (
          <Save className="mr-2 w-4 h-4" />
        )}
        {saving ? 'Saving...' : 'Save Price'}
      </Button>
    </div>
  )
}



// Read-Only Job Details Component
function ReadOnlyJobDetails({ job }: { job: Job }) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const statusConfig = getStatusConfig(job.status)
  const StatusIcon = statusConfig.icon
  const bucket = deriveAdminBucket(job)
  const bucketConfig = getBucketConfig(bucket)
  const flagged = isJobFlagged(job)

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className={`p-3 rounded-lg ${statusConfig.bgColor} border border-gray-700/50`}>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
          <span className={`font-medium ${statusConfig.color}`}>
            {statusConfig.label}
            {job.status && <span className="text-xs text-gray-500 ml-2">(status: {job.status})</span>}
          </span>
          {flagged && (
            <Badge className="ml-auto bg-red-500/20 text-red-300 text-xs">
              <Flag className="w-3 h-3 mr-1" />
              Flagged
            </Badge>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Bucket: <span className={bucketConfig.color}>{bucketConfig.label}</span>
        </div>
      </div>

      {/* Job Scope Details */}
      <JobScopeDetails job={job} />

      {/* Execution Details */}
      <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3">
        <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2 pb-2 border-b border-gray-700/50">
          <Activity className="w-4 h-4" />
          Execution Details
        </h4>

        {(job.assigned_to || job.landscaper_id) && (
          <div className="flex items-start gap-2 text-sm">
            <User className="w-4 h-4 text-purple-400/70 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-500 text-xs block">Assigned To</span>
              <span className="text-purple-300 break-all">
                {job.assigned_to || job.landscaper_id}
              </span>
            </div>
          </div>
        )}

        {job.priced_at && (
          <div className="flex items-start gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-emerald-400/70 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-500 text-xs block">Priced At</span>
              <span className="text-gray-200">{formatDate(job.priced_at)}</span>
            </div>
          </div>
        )}

        {job.completed_at && (
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400/70 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-500 text-xs block">Completed At</span>
              <span className="text-gray-200">{formatDate(job.completed_at)}</span>
            </div>
          </div>
        )}

        {job.flagged_at && (
          <div className="flex items-start gap-2 text-sm">
            <Flag className="w-4 h-4 text-red-400/70 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-500 text-xs block">Flagged At</span>
              <span className="text-red-300">{formatDate(job.flagged_at)}</span>
            </div>
          </div>
        )}

        {job.price != null && (
          <div className="flex items-start gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-emerald-400/70 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-500 text-xs block">Job Price</span>
              <span className="text-emerald-400 font-medium">${job.price.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Job List Item Component
function JobListItem({ 
  job, 
  isSelected, 
  onClick,
  showBucket = false
}: { 
  job: Job
  isSelected: boolean
  onClick: () => void
  showBucket?: boolean
}) {
  const statusConfig = getStatusConfig(job.status)
  const StatusIcon = statusConfig.icon
  const bucket = deriveAdminBucket(job)
  const bucketConfig = getBucketConfig(bucket)
  const flagged = isJobFlagged(job)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected 
          ? 'bg-emerald-500/20 border-emerald-500/50 border-l-4 border-l-emerald-500' 
          : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-gray-200 truncate">
              {getJobDisplayName(job)}
            </span>
            {flagged && (
              <Badge className="bg-red-500/20 text-red-300 text-xs px-1.5 py-0">
                <Flag className="w-3 h-3" />
              </Badge>
            )}
            {showBucket && (
              <Badge className={`${bucketConfig.bgColor} ${bucketConfig.color} text-xs px-1.5 py-0 flex items-center gap-1`}>
                {React.createElement(bucketConfig.icon, { className: "w-3 h-3" })}
                <span className="hidden sm:inline">{bucketConfig.label}</span>
              </Badge>
            )}
          </div>
          {job.client_email && (
            <span className="text-xs text-gray-500 block truncate">
              {job.client_email}
            </span>
          )}
          {(job.assigned_to || job.landscaper_id) && (
            <span className="text-xs text-purple-400/70 block truncate mt-0.5">
              <User className="w-3 h-3 inline mr-1" />
              {job.assigned_to || job.landscaper_id}
            </span>
          )}
          {job.selected_services && job.selected_services.length > 0 && (
            <span className="text-xs text-emerald-500/70 block truncate mt-0.5">
              {job.selected_services.slice(0, 2).join(', ')}
              {job.selected_services.length > 2 && ` +${job.selected_services.length - 2} more`}
            </span>
          )}
          {job.price != null && (
            <span className="text-xs text-emerald-400 block mt-0.5">
              <DollarSign className="w-3 h-3 inline" />
              {job.price.toFixed(2)}
            </span>
          )}
          {/* Show raw status for debugging */}
          {job.status && (
            <span className="text-xs text-gray-600 block mt-0.5">
              status: {job.status}
            </span>
          )}
        </div>
        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
          isSelected ? 'text-emerald-400' : 'text-gray-500'
        }`} />
      </div>
    </button>
  )
}

// All Jobs Table Component
function AllJobsTable({ 
  jobs, 
  selectedJob, 
  onSelectJob 
}: { 
  jobs: Job[]
  selectedJob: Job | null
  onSelectJob: (job: Job) => void
}) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800 mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-200 flex items-center gap-2">
          <List className="w-5 h-5" />
          All Jobs
          <Badge variant="secondary" className="ml-2 bg-gray-700 text-gray-300">
            {jobs.length}
          </Badge>
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Complete list of all jobs — bucket derived from status via lifecycle contract
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-3 text-gray-400 font-medium">Service</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">Client</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">Status</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">Bucket</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">Price</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">Created</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">Flags</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                jobs.map(job => {
                  const bucket = deriveAdminBucket(job)
                  const bucketConfig = getBucketConfig(bucket)
                  const flagged = isJobFlagged(job)
                  const isSelected = selectedJob?.id === job.id

                  return (
                    <tr 
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className={`border-b border-gray-800 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-emerald-500/10' 
                          : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <td className="py-2 px-3">
                        <span className="text-gray-200 font-medium">
                          {getJobDisplayName(job)}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-gray-400 text-xs truncate block max-w-[150px]">
                          {job.client_email || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-gray-500 text-xs">
                          {job.status || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge className={`${bucketConfig.bgColor} ${bucketConfig.color} text-xs`}>
                          {bucketConfig.label}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        {job.price != null ? (
                          <span className="text-emerald-400">${job.price.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-400 text-xs">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="py-2 px-3">
                        {flagged && (
                          <Badge className="bg-red-500/20 text-red-300 text-xs">
                            <Flag className="w-3 h-3" />
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// TAB TYPE — all AdminBucket values + 'all'
// ============================================================================
type BucketTab = AdminBucket | 'all'

// Ordered list of buckets for tabs
const VISIBLE_BUCKETS: AdminBucket[] = [
  'needs_pricing',
  'ready_to_release',
  'active',
  'pending_review',
  'completed',
  'exceptions',
]

export function AdminJobPricingPanel() {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [activeTab, setActiveTab] = useState<BucketTab>('needs_pricing')
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [showOverride, setShowOverride] = useState(false)

  const [stats, setStats] = useState<JobStats>({
    needs_pricing: 0,
    ready_to_release: 0,
    active: 0,
    pending_review: 0,
    completed: 0,
    exceptions: 0,
    unclassified: 0,
    total: 0
  })

  // ============================================================================
  // INPUT STATE MANAGEMENT
  // ============================================================================
  const [priceInput, setPriceInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [saving, setSaving] = useState(false)
  
  const lastInitializedJobIdRef = useRef<string | null>(null)

  // ============================================================================
  // QUERY: Fetch ALL jobs without any status filtering
  // ============================================================================
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
          completed_at,
          flagged_at,
          client_email,
          landscaper_id,
          created_at,
          admin_notes
        `)
        .order('created_at', { ascending: false })

      const jobsData = (data || []) as Job[]
      setJobs(jobsData)
    } catch (err: any) {
      setError(`Failed to load jobs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  // ============================================================================
  // REALTIME PATCHING
  // ============================================================================
  const jobPatcher = useMemo(() => patchArray<Job>(setJobs), [])

  useRealtimePatch({
    channelName: 'admin-pricing-realtime',
    subscriptions: [
      { table: 'jobs', event: 'UPDATE' },
      { table: 'jobs', event: 'INSERT' },
    ],
    enabled: true,
    onEvent: useCallback((eventType: any, table: string, newRow: any, oldRow: any) => {
      if (table === 'jobs') {
        jobPatcher(eventType, newRow, oldRow)
        if (newRow?.id) {
          setSelectedJob((prev) => {
            if (!prev || prev.id !== newRow.id) return prev
            return { ...prev, ...newRow }
          })
        }
      }
    }, [jobPatcher]),
  })

  // ============================================================================
  // STATS — recalculated from deriveAdminBucket() whenever jobs change
  // ============================================================================
  useEffect(() => {
    const counts: Record<AdminBucket, number> = {
      needs_pricing: 0,
      ready_to_release: 0,
      active: 0,
      pending_review: 0,
      completed: 0,
      exceptions: 0,
      unclassified: 0,
    }

    for (const job of jobs) {
      const bucket = deriveAdminBucket(job)
      counts[bucket] = (counts[bucket] || 0) + 1
    }

    setStats({
      ...counts,
      total: jobs.length,
    })
  }, [jobs])

  // ============================================================================
  // INPUT INITIALIZATION
  // ============================================================================
  useEffect(() => {
    const currentJobId = selectedJob?.id || null
    
    if (currentJobId !== lastInitializedJobIdRef.current) {
      lastInitializedJobIdRef.current = currentJobId
      
      if (selectedJob) {
        setPriceInput(selectedJob.price?.toString() || '')
        setNotesInput(selectedJob.admin_notes || '')
      } else {
        setPriceInput('')
        setNotesInput('')
      }
    }
  }, [selectedJob?.id])

  // Clear selected job and close override panel when switching tabs
  useEffect(() => {
    setSelectedJob(null)
    setShowOverride(false)
  }, [activeTab])

  // Close override panel when a different job is selected
  useEffect(() => {
    setShowOverride(false)
  }, [selectedJob?.id])


  // ============================================================================
  // CLIENT-SIDE GROUPING: Filter jobs by deriveAdminBucket()
  // ============================================================================
  const getJobsForTab = (tab: BucketTab): Job[] => {
    if (tab === 'all') return jobs
    return jobs.filter(j => deriveAdminBucket(j) === tab)
  }

  // Handle job selection
  const handleJobSelect = (job: Job) => {
    setSelectedJob(job)
    if (window.innerWidth < 768) {
      setMobileSheetOpen(true)
    }
  }

  const handleSavePrice = async () => {
    if (!selectedJob) return
    const price = parseFloat(priceInput)
    if (isNaN(price) || price <= 0) return

    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const adminId = userData.user?.id || null

      const { data: updatedRows, error: jobError } = await supabase
        .from('jobs')
        .update({
          price,
          priced_at: new Date().toISOString(),
          priced_by: adminId,
          admin_notes: notesInput.trim() || null,
          status: 'priced'
        })
        .eq('id', selectedJob.id)
        .select('id')

      if (jobError) throw jobError

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error(
          'Price update was blocked by database security policy. ' +
          'Your profile may not have admin permissions. ' +
          'Contact system administrator to verify your profiles.role is set to "admin".'
        )
      }

      await supabase
        .from('quotes')
        .update({
          approved_amount: price,
          approved_at: new Date().toISOString(),
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('job_id', selectedJob.id)

      toast({ 
        title: 'Price saved successfully', 
        description: `Job priced at $${price.toFixed(2)}${notesInput.trim() ? ' with notes' : ''}. Client can now pay.` 
      })
      setSelectedJob(null)
      setMobileSheetOpen(false)
      loadJobs()
    } catch (err: any) {
      toast({ title: 'Error saving price', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-400">{error}</p>
        <Button onClick={loadJobs} className="mt-4">Retry</Button>
      </div>
    )
  }

  // ============================================================================
  // SHARED PRICING PANEL CONTENT — stored as JSX variable (not component)
  // ============================================================================
  const pricingPanelContent = selectedJob ? (
    <>
      <JobScopeDetails job={selectedJob} />
      <PricingForm
        priceInput={priceInput}
        setPriceInput={setPriceInput}
        notesInput={notesInput}
        setNotesInput={setNotesInput}
        saving={saving}
        onSave={handleSavePrice}
        existingPrice={selectedJob.price}
      />
    </>
  ) : null


  // Build visible tabs — hide unclassified if empty, always show exceptions
  const visibleTabs: BucketTab[] = [
    ...VISIBLE_BUCKETS.filter(b => {
      if (b === 'unclassified') return stats.unclassified > 0
      return true
    }),
    ...(stats.unclassified > 0 ? ['unclassified' as AdminBucket] : []),
  ]

  const getTabConfig = (tab: BucketTab) => {
    if (tab === 'all') {
      return {
        label: 'All Jobs',
        icon: List,
        color: 'text-gray-400',
        bgColor: 'bg-gray-600',
        description: 'All jobs in the system',
      }
    }
    return getBucketConfig(tab)
  }

  const getTabCount = (tab: BucketTab): number => {
    if (tab === 'all') return stats.total
    return stats[tab as keyof JobStats] as number || 0
  }

  return (
    <>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
        {VISIBLE_BUCKETS.map(bucket => {
          const config = getBucketConfig(bucket)
          const count = stats[bucket as keyof JobStats] as number || 0
          return (
            <div
              key={bucket}
              className={`${config.bgColor} border border-${config.color.replace('text-', '')}/30 rounded-lg p-3 text-center cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => setActiveTab(bucket)}
            >
              <div className={`text-2xl font-bold ${config.color}`}>{count}</div>
              <div className="text-xs text-gray-400">{config.label}</div>
            </div>
          )
        })}
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-400">{stats.total}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BucketTab)} className="w-full">
        <TabsList className={`grid w-full mb-4 bg-gray-900/50 border border-gray-800 h-auto`} style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}>
          {visibleTabs.map((tab) => {
            const config = getTabConfig(tab)
            const Icon = config?.icon || HelpCircle
            const count = getTabCount(tab)
            return (
              <TabsTrigger 
                key={tab}
                value={tab} 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">{config?.label || tab}</span>
                {count > 0 && (
                  <Badge variant="secondary" className={`${config?.bgColor || 'bg-gray-600'} ${config?.color || 'text-gray-400'} text-xs px-1.5`}>
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Tab Content */}
        {visibleTabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jobs List Panel */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className={`${getTabConfig(tab)?.color || 'text-gray-400'} flex items-center gap-2`}>
                    {React.createElement(getTabConfig(tab)?.icon || HelpCircle, { className: "w-5 h-5" })}
                    {getTabConfig(tab)?.label || tab}
                    {getJobsForTab(tab).length > 0 && (
                      <Badge variant="secondary" className={`ml-2 ${getTabConfig(tab)?.bgColor || 'bg-gray-600'} ${getTabConfig(tab)?.color || 'text-gray-400'}`}>
                        {getJobsForTab(tab).length}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    {getTabConfig(tab)?.description || ''}
                  </p>
                </CardHeader>
                <CardContent>
                  {getJobsForTab(tab).length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      {React.createElement(getTabConfig(tab)?.icon || HelpCircle, { className: "w-10 h-10 mx-auto mb-2 opacity-50" })}
                      <p>No jobs in this category</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {tab === 'needs_pricing' && 'All jobs have been priced'}
                        {tab === 'ready_to_release' && 'No jobs waiting to be assigned'}
                        {tab === 'active' && 'No jobs currently in progress'}
                        {tab === 'pending_review' && 'No jobs awaiting review'}
                        {tab === 'completed' && 'No completed jobs yet'}
                        {tab === 'exceptions' && 'No flagged, blocked, or cancelled jobs'}
                        {tab === 'unclassified' && 'All jobs are properly classified'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                      {getJobsForTab(tab).map(job => (
                        <JobListItem
                          key={job.id}
                          job={job}
                          isSelected={selectedJob?.id === job.id}
                          onClick={() => handleJobSelect(job)}
                          showBucket={tab !== 'needs_pricing'}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Desktop Details Panel */}
              <Card className="bg-gray-900/50 border-gray-800 hidden md:block">
                <CardHeader className="pb-3">
                  <CardTitle className={`${getTabConfig(tab)?.color || 'text-gray-400'} flex items-center gap-2`}>
                    {tab === 'needs_pricing' ? (
                      <>
                        <FileText className="w-5 h-5" />
                        Job Pricing
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5" />
                        Job Details
                      </>
                    )}
                  </CardTitle>
                  {tab !== 'needs_pricing' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Read-only operational visibility
                    </p>
                  )}
                </CardHeader>
                <CardContent className="max-h-[700px] overflow-y-auto">
                  {!selectedJob ? (
                    <div className="text-center py-10 text-gray-400">
                      {tab === 'needs_pricing' ? (
                        <>
                          <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>Select a job to set pricing</p>
                        </>
                      ) : (
                        <>
                          <Eye className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p>Select a job to view details</p>
                        </>
                      )}
                      <p className="text-sm text-gray-500 mt-1">Click on a job from the list</p>
                    </div>
                  ) : (
                    <>
                      {tab === 'needs_pricing' && isJobEditable(selectedJob) ? (
                        pricingPanelContent
                      ) : (
                        <ReadOnlyJobDetails job={selectedJob} />
                      )}

                      {/* Override Job — toggle button + collapsible panel */}
                      <div className="mt-4 pt-4 border-t border-gray-700/50">
                        <button
                          type="button"
                          onClick={() => setShowOverride(prev => !prev)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-sm"
                        >
                          <span className="flex items-center gap-2 text-amber-300 font-medium">
                            <ShieldAlert className="w-4 h-4" />
                            Override Job
                          </span>
                          {showOverride ? (
                            <ChevronUp className="w-4 h-4 text-amber-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-amber-400" />
                          )}
                        </button>

                        {showOverride && (
                          <div className="mt-3">
                            <AdminOverridePanel
                              selectedJob={selectedJob}
                              refreshJobs={loadJobs}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>

              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* All Jobs Table */}
      <AllJobsTable 
        jobs={jobs} 
        selectedJob={selectedJob} 
        onSelectJob={handleJobSelect} 
      />

      {/* Mobile Bottom Sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent 
          side="bottom" 
          className="bg-gray-900 border-gray-800 p-0 h-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div 
            className="max-h-[85dvh] overflow-y-auto overscroll-contain"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
          >
            {/* Sticky header */}
            <div className="px-4 pt-4 pb-2 sticky top-0 bg-gray-900 z-10 border-b border-gray-800">
              <SheetHeader>
                <SheetTitle className={`flex items-center gap-2 text-base ${getTabConfig(activeTab)?.color || 'text-gray-400'}`}>
                  {activeTab === 'needs_pricing' && isJobEditable(selectedJob) ? (
                    <DollarSign className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                  <span className="truncate">
                    {selectedJob ? getJobDisplayName(selectedJob) : 
                      (activeTab === 'needs_pricing' ? 'Set Job Price' : 'Job Details')}
                  </span>
                  {selectedJob && isJobFlagged(selectedJob) && (
                    <Badge className="bg-red-500/20 text-red-300 text-xs ml-auto">
                      <Flag className="w-3 h-3 mr-1" />
                      Flagged
                    </Badge>
                  )}
                </SheetTitle>
                {selectedJob?.client_email && (
                  <p className="text-xs text-gray-500 mt-0.5">{selectedJob.client_email}</p>
                )}
              </SheetHeader>
            </div>
            
            {/* Scrollable content */}
            <div className="px-4 py-4 pb-8">
              {selectedJob && (
                <>
                  {activeTab === 'needs_pricing' && isJobEditable(selectedJob) ? (
                    pricingPanelContent
                  ) : (
                    <ReadOnlyJobDetails job={selectedJob} />
                  )}

                  {/* Override Job — toggle button + collapsible panel (mobile) */}
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <button
                      type="button"
                      onClick={() => setShowOverride(prev => !prev)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-sm"
                    >
                      <span className="flex items-center gap-2 text-amber-300 font-medium">
                        <ShieldAlert className="w-4 h-4" />
                        Override Job
                      </span>
                      {showOverride ? (
                        <ChevronUp className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      )}
                    </button>

                    {showOverride && (
                      <div className="mt-3">
                        <AdminOverridePanel
                          selectedJob={selectedJob}
                          refreshJobs={loadJobs}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>

        </SheetContent>
      </Sheet>
    </>
  )
}

export default AdminJobPricingPanel
