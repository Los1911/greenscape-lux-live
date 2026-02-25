import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Camera, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  RefreshCw,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { JobPhoto, groupPhotosByType } from '@/types/jobPhoto';
import BeforeAfterComparison from '@/components/photos/BeforeAfterComparison';
import PhotoLightbox from '@/components/photos/PhotoLightbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface JobWithPhotos {
  id: string;
  service_name: string;
  service_address: string | null;
  status: string;
  customer_name: string;
  preferred_date: string | null;
  created_at: string;
  landscaper_id: string | null;
  photos: JobPhoto[];
  landscaper_name?: string;
}

interface AdminJobPhotoReviewProps {
  className?: string;
}

export default function AdminJobPhotoReview({ className = '' }: AdminJobPhotoReviewProps) {
  const [jobs, setJobs] = useState<JobWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<JobWithPhotos | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<JobPhoto[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchJobsWithPhotos();
  }, []);

  const fetchJobsWithPhotos = async () => {
    setLoading(true);
    try {
      // Fetch ALL photos first, then get job details
      // This avoids the !inner JOIN issue that filters out jobs with certain statuses
      const { data: photosData, error: photosError } = await supabase
        .from('job_photos')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (photosError) throw photosError;

      if (!photosData || photosData.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      // Get unique job IDs from photos
      const jobIds = [...new Set(photosData.map(p => p.job_id))];

      // Fetch job details for all jobs that have photos
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          service_name,
          service_address,
          status,
          customer_name,
          preferred_date,
          created_at,
          landscaper_id
        `)
        .in('id', jobIds);

      if (jobsError) throw jobsError;

      // Create a map of jobs by ID for quick lookup
      const jobDetailsMap = new Map(
        (jobsData || []).map(job => [job.id, job])
      );

      // Group photos by job and combine with job details
      const jobMap = new Map<string, JobWithPhotos>();
      
      for (const photo of photosData) {
        const jobDetails = jobDetailsMap.get(photo.job_id);
        if (!jobDetails) continue; // Skip photos for jobs that don't exist
        
        if (!jobMap.has(photo.job_id)) {
          jobMap.set(photo.job_id, {
            id: jobDetails.id,
            service_name: jobDetails.service_name || 'Service',
            service_address: jobDetails.service_address,
            status: jobDetails.status || 'unknown',
            customer_name: jobDetails.customer_name || 'Unknown',
            preferred_date: jobDetails.preferred_date,
            created_at: jobDetails.created_at,
            landscaper_id: jobDetails.landscaper_id,
            photos: []
          });
        }
        
        jobMap.get(photo.job_id)!.photos.push({
          id: photo.id,
          job_id: photo.job_id,
          file_url: photo.file_url,
          type: photo.type,
          uploaded_at: photo.uploaded_at,
          metadata: photo.metadata,
          caption: photo.caption,
          sort_order: photo.sort_order
        });
      }

      // Fetch landscaper names
      const landscaperIds = [...new Set([...jobMap.values()].map(j => j.landscaper_id).filter(Boolean))];
      if (landscaperIds.length > 0) {
        const { data: landscapers } = await supabase
          .from('landscapers')
          .select('id, first_name, last_name')
          .in('id', landscaperIds);

        if (landscapers) {
          const landscaperMap = new Map(landscapers.map(l => [l.id, `${l.first_name} ${l.last_name}`]));
          for (const job of jobMap.values()) {
            if (job.landscaper_id) {
              job.landscaper_name = landscaperMap.get(job.landscaper_id);
            }
          }
        }
      }

      setJobs([...jobMap.values()]);

    } catch (err) {
      console.error('Error fetching jobs with photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    // Status filter
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        job.service_name?.toLowerCase().includes(search) ||
        job.customer_name?.toLowerCase().includes(search) ||
        job.landscaper_name?.toLowerCase().includes(search) ||
        job.service_address?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      completed_pending_review: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      active: 'bg-amber-500/20 text-amber-300 border-amber-500/30',

      flagged_review: 'bg-red-500/20 text-red-300 border-red-500/30',
      assigned: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      priced: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      scheduled: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    };
    return styles[status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };


  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openLightbox = (photos: JobPhoto[], index: number = 0) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDownloadAll = async (job: JobWithPhotos) => {
    for (const photo of job.photos) {
      try {
        const response = await fetch(photo.file_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${job.id}_${photo.type}_${photo.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Download error:', err);
      }
    }
  };

  const renderJobCard = (job: JobWithPhotos) => {
    const photoGroup = groupPhotosByType(job.photos);
    const isFlagged = job.status === 'flagged_review';

    return (
      <Card 
        key={job.id} 
        className={`bg-slate-900/50 border-slate-700/50 hover:border-emerald-500/30 transition-colors cursor-pointer ${
          isFlagged ? 'ring-1 ring-red-500/30' : ''
        }`}
        onClick={() => setSelectedJob(job)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium text-white">{job.service_name}</h3>
              <p className="text-sm text-slate-400">{job.customer_name}</p>
            </div>
            <Badge className={`${getStatusBadge(job.status)} border`}>
              {job.status === 'flagged_review' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {job.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Photo Thumbnails */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {job.photos.slice(0, 4).map((photo, index) => (
              <div 
                key={photo.id}
                className="relative aspect-square rounded overflow-hidden group"
                onClick={(e) => { e.stopPropagation(); openLightbox(job.photos, index); }}
              >
                <img 
                  src={photo.file_url} 
                  alt={photo.type}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                  photo.type === 'before' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                {index === 3 && job.photos.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-medium">+{job.photos.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Photo Count Summary */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                {photoGroup.before.length} before
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {photoGroup.after.length} after
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(job.photos[0]?.uploaded_at)}
            </span>
          </div>

          {/* Landscaper Info */}
          {job.landscaper_name && (
            <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-400">
              <User className="w-3 h-3" />
              <span>{job.landscaper_name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-emerald-300 flex items-center gap-2">
              <Camera className="w-6 h-6" />
              Job Photo Review
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchJobsWithPhotos}
              disabled={loading}
              className="border-slate-600"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search jobs, clients, landscapers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-600">
                  <Filter className="w-4 h-4 mr-2" />
                  {statusFilter === 'all' ? 'All Status' : statusFilter.replace('_', ' ')}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-slate-700">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed_pending_review')}>
                  <Clock className="w-4 h-4 mr-2 text-orange-400" />
                  Pending Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('flagged_review')}>
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                  Flagged for Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  <Clock className="w-4 h-4 mr-2 text-amber-400" />
                  In Progress
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setStatusFilter('assigned')}>
                  <User className="w-4 h-4 mr-2 text-blue-400" />
                  Assigned
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>


          {/* Stats - Include pending review count */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{jobs.length}</p>
              <p className="text-xs text-slate-400">Jobs with Photos</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-400">
                {jobs.filter(j => j.status === 'completed_pending_review').length}
              </p>
              <p className="text-xs text-slate-400">Pending Review</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {jobs.filter(j => j.status === 'completed').length}
              </p>
              <p className="text-xs text-slate-400">Completed</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-400">
                {jobs.filter(j => j.status === 'flagged_review').length}
              </p>
              <p className="text-xs text-slate-400">Flagged</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {jobs.reduce((sum, j) => sum + j.photos.length, 0)}
              </p>
              <p className="text-xs text-slate-400">Total Photos</p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Job Grid or Selected Job Detail */}
      {selectedJob ? (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {selectedJob.service_name}
                  <Badge className={`${getStatusBadge(selectedJob.status)} border`}>
                    {selectedJob.status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedJob.customer_name}
                  </span>
                  {selectedJob.landscaper_name && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4 text-emerald-400" />
                      {selectedJob.landscaper_name}
                    </span>
                  )}
                  {selectedJob.service_address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedJob.service_address}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedJob.preferred_date)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadAll(selectedJob)}
                  className="border-slate-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedJob(null)}
                  className="border-slate-600"
                >
                  Back to List
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BeforeAfterComparison 
              photos={selectedJob.photos}
              showTimestamps={true}
              showMetadata={true}
              title="Work Documentation"
            />

            {/* Photo Timestamps for Admin */}
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Photo Timeline</h4>
              <div className="space-y-2">
                {selectedJob.photos
                  .sort((a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime())
                  .map(photo => (
                    <div 
                      key={photo.id}
                      className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg text-sm"
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        photo.type === 'before' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <span className="text-slate-300 capitalize">{photo.type}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">
                        {new Date(photo.uploaded_at).toLocaleString()}
                      </span>
                      {photo.metadata?.gps && (
                        <>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            GPS verified
                          </span>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openLightbox([photo], 0)}
                        className="ml-auto text-slate-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-slate-900/50 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-700 rounded w-1/2" />
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} className="aspect-square bg-slate-700 rounded" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map(renderJobCard)}
            </div>
          ) : (
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="py-12 text-center">
                <Camera className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                <p className="text-slate-400">No jobs with photos found</p>
                {searchTerm && (
                  <p className="text-sm text-slate-500 mt-1">
                    Try adjusting your search terms
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Lightbox */}
      <PhotoLightbox
        photos={lightboxPhotos}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        showMetadata={true}
      />
    </div>
  );
}
