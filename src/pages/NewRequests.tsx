import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Job } from '@/types/job'

const NewRequests: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acceptingJob, setAcceptingJob] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingJobs()
  }, [])

  const fetchPendingJobs = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'pending')
        .is('landscaper_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      setJobs(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptJob = async (jobId: string) => {
    try {
      setAcceptingJob(jobId)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('jobs')
        .update({
          landscaper_id: user.id,
          status: 'assigned', // ✅ FIXED STATUS
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) throw error

      setJobs(prev => prev.filter(job => job.id !== jobId))
    } catch (err: any) {
      setError(err.message || 'Failed to accept job')
    } finally {
      setAcceptingJob(null)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen text-white py-8 px-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-8 text-center">
          New Job Requests
        </h1>

        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No pending job requests
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
              <Card key={job.id} className="bg-black/80 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-400">
                    {job.service_type}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Customer</p>
                    <p>{job.customer_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Address</p>
                    <p>{job.service_address}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Price</p>
                    <p className="text-green-400 font-semibold">
                      ${job.price ?? 0}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleAcceptJob(job.id)}
                    disabled={acceptingJob === job.id}
                    className="w-full bg-green-500 hover:bg-green-600 text-black font-bold"
                  >
                    {acceptingJob === job.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      'Accept Job'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default NewRequests
