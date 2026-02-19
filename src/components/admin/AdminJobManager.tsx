import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Trash2, ChevronDown, ArrowUpDown } from 'lucide-react'
import { Job } from '@/types/job'

type SortField = 'created_at' | 'price' | 'status'
type SortOrder = 'asc' | 'desc'

export default function AdminJobManager() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId)

      if (error) throw error
      fetchJobs()
    } catch (error) {
      console.error('Error updating job status:', error)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error
      fetchJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const filteredJobs = jobs
    .filter(job => statusFilter === 'all' || job.status === statusFilter)
    .sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === 'created_at') {
        aVal = new Date(a.created_at).getTime()
        bVal = new Date(b.created_at).getTime()
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      priced: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      scheduled: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      in_progress: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30'
    }

    return styles[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  if (loading) {
    return (
      <Card className="p-6 text-green-300">
        Loading jobs...
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-green-300">Job Management</h2>

      <div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-black border border-green-500/40 rounded px-4 py-2 text-green-300"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="priced">Priced</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredJobs.map(job => (
          <div
            key={job.id}
            className="border border-gray-700/40 p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <div className="font-semibold text-green-200">
                {job.service_name}
              </div>
              <div className="text-sm text-gray-400">
                {job.customer_name}
              </div>
            </div>

            <Badge className={getStatusBadge(job.status)}>
              {job.status.replace('_', ' ')}
            </Badge>

            <div className="flex gap-2">
              {job.status !== 'completed' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(job.id, 'completed')}
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}

              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteJob(job.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
