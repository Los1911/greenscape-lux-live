import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Briefcase, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { findBestMatches, LandscaperMatch } from '@/utils/jobMatchingEngine';
import { JobMatchingPanel } from './JobMatchingPanel';

interface Job {
  id: string;
  service_type: string;
  service_name?: string;
  service_address?: string;
  property_address?: string;
  property_city?: string;
  property_state?: string;
  status: string;
  landscaper_id?: string;
  client_email?: string;
  customer_name?: string;
  preferred_date?: string;
  created_at: string;
  price?: number;
  // Location coordinates for matching
  latitude?: number;
  longitude?: number;
}

export function JobMatchingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [matches, setMatches] = useState<{ [key: string]: LandscaperMatch[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposedDates, setProposedDates] = useState<{ [key: string]: Date }>({});
  const [durations, setDurations] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Wait for auth to resolve before loading data
    if (authLoading) return;
    if (!user) return;
    
    loadUnassignedJobs();
  }, [authLoading, user]);

  async function loadUnassignedJobs() {
    setLoading(true);
    setError(null);
    
    try {
      // Query JOBS table - the source of truth
      // Get jobs that need assignment (no landscaper assigned yet)
      // Include statuses: pending, available, priced (jobs ready for assignment)
      const { data, error: queryError } = await supabase
        .from('jobs')
        .select(`
          id,
          service_type,
          service_name,
          service_address,
          property_address,
          property_city,
          property_state,
          status,
          landscaper_id,
          client_email,
          customer_name,
          preferred_date,
          created_at,
          price
        `)
        .is('landscaper_id', null)
        .in('status', ['pending', 'available', 'priced'])
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('[JobMatchingDashboard] Query error:', queryError);
        throw queryError;
      }

      const jobsData = (data || []) as Job[];
      setJobs(jobsData);
      
      if (jobsData.length > 0 && !selectedJob) {
        setSelectedJob(jobsData[0].id);
        await findMatches(jobsData[0]);
      }
    } catch (err: any) {
      console.error('[JobMatchingDashboard] Error loading jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  async function findMatches(job: Job) {
    // Build location from available address fields
    // Default to 0,0 if no location data (matching engine will handle this)
    const location = {
      lat: job.latitude || 0,
      lng: job.longitude || 0
    };

    const results = await findBestMatches(
      {
        quote_id: job.id, // Using job.id - the matching engine uses this as identifier
        client_location: location,
        service_type: job.service_type || job.service_name || 'general',
        urgency: 'medium'
      },
      5,
      proposedDates[job.id],
      durations[job.id] || 2
    );
    
    setMatches(prev => ({ ...prev, [job.id]: results }));
  }

  const handleDateChange = (jobId: string, dateStr: string) => {
    const date = new Date(dateStr);
    setProposedDates(prev => ({ ...prev, [jobId]: date }));
    const job = jobs.find(j => j.id === jobId);
    if (job) findMatches(job);
  };

  const handleDurationChange = (jobId: string, duration: number) => {
    setDurations(prev => ({ ...prev, [jobId]: duration }));
    const job = jobs.find(j => j.id === jobId);
    if (job) findMatches(job);
  };

  const handleAssignmentComplete = () => {
    // Refresh the jobs list after assignment
    loadUnassignedJobs();
  };

  const getDisplayAddress = (job: Job): string => {
    if (job.service_address) return job.service_address;
    if (job.property_address) {
      const parts = [job.property_address];
      if (job.property_city) parts.push(job.property_city);
      if (job.property_state) parts.push(job.property_state);
      return parts.join(', ');
    }
    return 'No address';
  };

  // Auth loading guard
  if (authLoading) {
    return (
      <Card className="bg-black/40 border-emerald-500/20">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-black/40 border-emerald-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-red-400">{error}</p>
          <Button 
            onClick={loadUnassignedJobs}
            variant="outline"
            className="border-emerald-500/30 text-emerald-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Data loading state
  if (loading) {
    return (
      <Card className="bg-black/40 border-emerald-500/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-emerald-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-emerald-300">
              <Briefcase className="h-5 w-5" />
              Unassigned Jobs ({jobs.length})
            </CardTitle>
            <Button
              onClick={loadUnassignedJobs}
              variant="outline"
              size="sm"
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              No unassigned jobs at this time.
            </p>
          ) : (
            <Tabs value={selectedJob || undefined} onValueChange={setSelectedJob}>
              <TabsList className="w-full justify-start overflow-x-auto bg-black/40 border border-emerald-500/20">
                {jobs.map((job) => (
                  <TabsTrigger 
                    key={job.id} 
                    value={job.id}
                    className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300"
                  >
                    {job.service_type || job.service_name || 'Job'}
                    <Badge variant="outline" className="ml-2 border-emerald-500/30 text-emerald-300/70">
                      {new Date(job.created_at).toLocaleDateString()}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {jobs.map((job) => (
                <TabsContent key={job.id} value={job.id} className="space-y-4">
                  {/* Job Details Summary */}
                  <div className="p-4 bg-black/30 rounded-lg border border-emerald-500/10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Service</p>
                        <p className="text-white font-medium">{job.service_type || job.service_name || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="text-white font-medium">{job.customer_name || job.client_email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Address</p>
                        <p className="text-white font-medium truncate">{getDisplayAddress(job)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-0">
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    {job.price && (
                      <div className="mt-3 pt-3 border-t border-emerald-500/10">
                        <span className="text-gray-500">Price: </span>
                        <span className="text-emerald-400 font-semibold">${job.price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Scheduling Controls */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-black/30 rounded-lg border border-emerald-500/10">
                    <div>
                      <Label htmlFor={`date-${job.id}`} className="text-gray-400">Proposed Date</Label>
                      <Input
                        id={`date-${job.id}`}
                        type="datetime-local"
                        onChange={(e) => handleDateChange(job.id, e.target.value)}
                        className="bg-black/40 border-emerald-500/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`duration-${job.id}`} className="text-gray-400">Est. Duration (hours)</Label>
                      <Input
                        id={`duration-${job.id}`}
                        type="number"
                        min="0.5"
                        step="0.5"
                        defaultValue="2"
                        onChange={(e) => handleDurationChange(job.id, parseFloat(e.target.value))}
                        className="bg-black/40 border-emerald-500/30 text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Job Matching Panel - pass job.id as the identifier */}
                  <JobMatchingPanel 
                    quoteId={job.id}
                    matches={matches[job.id] || []}
                    onAssign={handleAssignmentComplete}
                    jobLat={job.latitude}
                    jobLng={job.longitude}
                    proposedDate={proposedDates[job.id]}
                    estimatedDuration={durations[job.id] || 2}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
