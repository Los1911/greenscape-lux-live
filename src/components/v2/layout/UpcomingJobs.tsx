import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Job {
  id: string;
  customer_name: string;
  service_address: string;
  service_type: string;
  preferred_date: string;
  price?: number;
  status: string;
  client_email: string;
}

export default function UpcomingJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingJobs();
  }, []);

  const loadUpcomingJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('landscaper_id', user.id)
        .in('status', ['scheduled', 'pending'])
        .order('preferred_date', { ascending: true });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading upcoming jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'border-green-500/50 text-green-300';
      case 'pending': return 'border-yellow-500/50 text-yellow-300';
      default: return 'border-gray-500/50 text-gray-300';
    }
  };

  if (loading) {
    return <div className="text-green-300">Loading upcoming jobs...</div>;
  }

  return (
    <div className="h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-500/20">
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-green-300">Upcoming Jobs</h2>
        {jobs.length > 0 && (
          <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
            {jobs.length}
          </span>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-8 text-green-300/50">No upcoming jobs.</div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {jobs.map((job) => (
            <div key={job.id} className="bg-black/40 rounded-lg p-4 border border-green-500/20 hover:border-green-500/40 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-green-300">{job.service_type}</h4>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(job.status)}`}
                >
                  {job.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-gray-300 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span>{formatDate(job.preferred_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span>{job.service_address}</span>
                </div>
                {job.price && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span>${job.price}</span>
                  </div>
                )}
              </div>
              
              <button className="w-full px-4 py-2 text-sm border border-green-500/25 text-green-300 hover:bg-green-500/20 rounded-lg transition-colors">
                Message {job.customer_name}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}