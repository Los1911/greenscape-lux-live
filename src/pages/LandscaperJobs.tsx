import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardLayout, StatusLegend, formatFriendlyDate, formatMoney } from "@/components/SharedUI"
import { JobDrawer } from "@/components/JobDrawer"
import { useToast } from "@/hooks/use-toast"
import { Job } from "@/professionals/types-and-actions"

async function getAuth() {
  try {
    const { data } = await supabase.auth.getUser()
    return { email: data.user?.email ?? null, uid: data.user?.id ?? null }
  } catch { return { email: null, uid: null } }
}

function orForLandscaper(uid: string | null, email: string | null) {
  const parts: string[] = []
  if (uid) { parts.push(`landscaper_id.eq.${uid}`); parts.push(`assigned_to.eq.${uid}`) }
  if (email) { parts.push(`landscaper_email.eq.${email}`); parts.push(`assigned_email.eq.${email}`) }
  return parts.join(",")
}

async function fetchJobs(): Promise<Job[]> {
  const { email, uid } = await getAuth()
  const orFilter = orForLandscaper(uid, email)
  if (!orFilter) return []
  const { data, error } = await supabase.from("jobs").select("id,service_name,service_type,service_address,scheduled_at,completed_at,status,price,landscaper_id,landscaper_email,assigned_to,assigned_email").or(orFilter).order("scheduled_at", { ascending: true })
  if (error) { console.error('[LANDSCAPER JOBS] Fetch error:', error); return [] }
  return (data as Job[]) || []
}

function demoJobs(): Job[] {
  const one = new Date(Date.now() + 60*60*1000).toISOString()
  const three = new Date(Date.now() + 3*60*60*1000).toISOString()
  const y = new Date(Date.now() - 24*60*60*1000).toISOString()
  return [
    { id: "d1", title: "Weekly Lawn Care", service: "Mow Edge Blow", address: "742 Evergreen Ter", scheduled_at: one, status: "scheduled", price: 85 },
    { id: "d2", title: "Hedge Trim", service: "Shrub shaping set of 10", address: "19 Parkway Dr", scheduled_at: three, status: "scheduled", price: 120 },
    { id: "d3", title: "Mulch Install", service: "Red mulch 8 bags", address: "1215 Ivy Ridge", scheduled_at: y, status: "completed", price: 260 }
  ]
}

export default function LandscaperJobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("landscaperJobsActiveTab") || "upcoming")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState(() => localStorage.getItem("landscaperJobsSortOption") || "date_asc")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { toast } = useToast();

  useEffect(() => {
    let alive = true
    async function load() {
      console.log('[LANDSCAPER JOBS] Starting data load...')
      setLoading(true)
      try {
        const data = await fetchJobs()
        if (!alive) return
        console.log('[LANDSCAPER JOBS] Jobs loaded:', data.length)
        setJobs(data.length ? data : demoJobs())
        setLoadError(null)
      } catch (error) {
        console.error('[LANDSCAPER JOBS]', error)
        if (alive) { setLoadError('Data could not be loaded in this preview, but you are still signed in.'); setJobs(demoJobs()) }
      } finally { if (alive) setLoading(false) }
    }
    load()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const jobId = searchParams.get('id');
    if (jobId && jobs.length > 0) {
      const targetJob = jobs.find(j => j.id === jobId);
      if (targetJob) { setSelectedJob(targetJob); setDrawerOpen(true); setActiveTab(String(targetJob.status).toLowerCase() === 'completed' ? 'completed' : 'upcoming'); setSearchParams({}); }
      else { toast({ title: "Job not found", description: "The requested job could not be found.", variant: "destructive" }); }
    }
  }, [searchParams, jobs, setSearchParams, toast]);

  useEffect(() => { localStorage.setItem("landscaperJobsActiveTab", activeTab) }, [activeTab])
  useEffect(() => { localStorage.setItem("landscaperJobsSortOption", sortOption) }, [sortOption])

  const filteredJobs = useMemo(() => {
    let filtered = jobs || []
    if (activeTab === "upcoming") filtered = filtered.filter(j => String(j?.status || '').toLowerCase() !== "completed")
    else if (activeTab === "completed") filtered = filtered.filter(j => String(j?.status || '').toLowerCase() === "completed")
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(j => String(j?.service_name || j?.title || "").toLowerCase().includes(q) || String(j?.service_address || j?.address || "").toLowerCase().includes(q))
    }
    filtered.sort((a, b) => {
      if (sortOption === "date_asc") return (a?.scheduled_at || "").localeCompare(b?.scheduled_at || "")
      if (sortOption === "date_desc") return (b?.scheduled_at || "").localeCompare(a?.scheduled_at || "")
      if (sortOption === "price_desc") return (b?.price || 0) - (a?.price || 0)
      if (sortOption === "price_asc") return (a?.price || 0) - (b?.price || 0)
      return 0
    })
    return filtered
  }, [jobs, activeTab, searchQuery, sortOption])

  const handleJobClick = (job: Job) => { setSelectedJob(job); setDrawerOpen(true) }
  const handleJobUpdate = async () => { const data = await fetchJobs(); setJobs(data.length ? data : demoJobs()) }

  if (loadError && !loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-emerald-300">Jobs Unavailable</h2>
          <p className="text-emerald-200/70">{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 rounded-xl hover:bg-emerald-500/30">Refresh</button>
        </div>
      </div>
    )
  }

  return (
    // Removed pb-20 - no bottom nav on mobile anymore. Added proper scroll classes.
    <div className="min-h-screen bg-black text-white overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-4xl px-3 md:px-4 py-5 md:py-6">
        <section className="mb-4 md:mb-6"><h1 className="text-2xl md:text-3xl font-bold text-emerald-100">Jobs</h1><p className="mt-1 text-emerald-200/70">Manage and track your work</p></section>
        <section className="sticky top-0 z-40 bg-black/95 backdrop-blur pb-3 mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {["upcoming", "completed", "all"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-emerald-600 text-white" : "bg-emerald-900/20 text-emerald-200 hover:bg-emerald-800/30"}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Search jobs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-emerald-900/20 border-emerald-800/40 text-white placeholder:text-emerald-200/50" />
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-48 bg-emerald-900/20 border-emerald-800/40 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-emerald-900/90 border-emerald-800/40">
                <SelectItem value="date_asc">Date: Soonest first</SelectItem>
                <SelectItem value="date_desc">Date: Latest first</SelectItem>
                <SelectItem value="price_desc">Price: High to low</SelectItem>
                <SelectItem value="price_asc">Price: Low to high</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
        <section className="mb-6">
          <CardLayout title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Jobs`}>
            {loading ? (<div className="py-8 text-center text-emerald-200/70">Loading...</div>) : filteredJobs.length === 0 ? (
              <div className="py-8 text-center"><div className="text-emerald-200/70 mb-3">{activeTab === "all" ? "No jobs found" : `No ${activeTab} jobs`}</div>{activeTab !== "all" && <Button onClick={() => setActiveTab("all")} variant="secondary" size="sm">View All</Button>}</div>
            ) : (
              <div className="divide-y divide-emerald-900/50">
                {filteredJobs.map(job => (
                  <div key={job?.id || Math.random()} onClick={() => job && handleJobClick(job)} className="flex items-center justify-between py-3 md:py-4 cursor-pointer hover:bg-emerald-900/10 rounded transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${String(job?.status || '').toLowerCase() === "completed" ? "bg-gray-400" : String(job?.status || '').toLowerCase() === "active" ? "bg-yellow-400" : "bg-emerald-500"}`} />

                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm md:text-base truncate">{job?.service_name || job?.title || job?.service_type || "Untitled Job"}</div>
                        <div className="text-xs md:text-sm text-emerald-200/70 truncate">{job?.service_address || job?.address || "Address TBA"}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0"><div className="text-xs md:text-sm text-emerald-200/70">{formatFriendlyDate(job?.scheduled_at)}</div><div className="text-emerald-400 font-semibold">{formatMoney(job?.price || 0)}</div></div>
                  </div>
                ))}
              </div>
            )}
            <StatusLegend />
          </CardLayout>
        </section>
      </div>
      <JobDrawer job={selectedJob} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onUpdate={handleJobUpdate} />
      {/* Mobile bottom nav removed for premium scroll-safe Lux experience */}
    </div>
  )
}
