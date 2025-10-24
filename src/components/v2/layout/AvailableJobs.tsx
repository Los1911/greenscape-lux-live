import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JobCard } from "@/components/landscaper/JobCard";
import { useToast } from "@/components/ui/use-toast";

interface Quote {
  id: string;
  customer_name: string;
  customer_email: string;
  location: string;
  service_type: string;
  preferred_date: string;
  notes?: string;
  status: string;
  created_at: string;
}

export default function AvailableJobs() {
  const [isApproved, setIsApproved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Quote[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkApprovalAndLoadJobs = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('landscapers')
            .select('approved')
            .eq('id', user.id)
            .single();
          
          const approved = data?.approved || false;
          setIsApproved(approved);
          
          if (approved) {
            await loadAvailableJobs();
          }
        }
      } catch (error) {
        console.error('Error checking approval:', error);
      } finally {
        setLoading(false);
      }
    };
    checkApprovalAndLoadJobs();
  }, []);

  const loadAvailableJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .in('status', ['pending', 'available', null])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load available jobs",
        variant: "destructive"
      });
    }
  };

  const handleAcceptJob = async (quoteId: string) => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get landscaper info
      const { data: landscaper } = await supabase
        .from('landscapers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!landscaper) throw new Error('Landscaper not found');

      // Get quote details
      const quote = jobs.find(j => j.id === quoteId);
      if (!quote) throw new Error('Quote not found');

      // Create job from quote with correct schema
      const { error: jobError } = await supabase
        .from('jobs')
        .insert({
          customer_name: quote.customer_name || quote.customer_email?.split('@')[0] || 'Unknown',
          service_name: quote.service_type,
          service_type: quote.service_type,
          service_address: quote.location,
          preferred_date: quote.preferred_date,
          status: 'scheduled',
          landscaper_id: user.id,
          client_email: quote.customer_email,
          price: 0 // Default price, can be updated later
        });

      if (jobError) throw jobError;

      // Send notification emails
      try {
        await supabase.functions.invoke('job-assignment-notification', {
          body: {
            jobId: quoteId,
            customerEmail: quote.customer_email,
            landscaperEmail: landscaper.email,
            jobDetails: {
              customerName: quote.customer_name,
              serviceType: quote.service_type,
              location: quote.location,
              preferredDate: quote.preferred_date,
              notes: quote?.notes ?? ''
            }
          }
        });
      } catch (emailError) {
        console.error('Failed to send notification emails:', emailError);
      }

      // Update quote status
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ status: 'assigned' })
        .eq('id', quoteId);

      if (updateError) throw updateError;

      setJobs(prev => prev.filter(j => j.id !== quoteId));
      
      toast({
        title: "Success",
        description: "Job accepted successfully!",
      });

    } catch (error) {
      console.error('Error accepting job:', error);
      toast({
        title: "Error",
        description: "Failed to accept job",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineJob = async (quoteId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'declined' })
        .eq('id', quoteId);

      if (error) throw error;

      setJobs(prev => prev.filter(j => j.id !== quoteId));
      
      toast({
        title: "Job declined",
        description: "The job has been declined",
      });

    } catch (error) {
      console.error('Error declining job:', error);
      toast({
        title: "Error",
        description: "Failed to decline job",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
        </svg>
        <h3 className="text-lg font-semibold text-white">Available Jobs</h3>
        {jobs.length > 0 && (
          <span className="bg-emerald-600 text-white px-2 py-1 rounded-full text-xs">
            {jobs.length}
          </span>
        )}
      </div>
      
      {!isApproved ? (
        <div className="text-gray-400">Account approval required to view jobs.</div>
      ) : jobs.length === 0 ? (
        <div className="text-gray-400">No available jobs at the moment.</div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onAccept={handleAcceptJob}
              onDecline={handleDeclineJob}
              loading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
