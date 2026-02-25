import GlowCard from "@/components/v2/GlowCard";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function ActionsPanel() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('landscapers')
        .select('approved')
        .eq('user_id', user.id)
        .single();
      
      setIsApproved(data?.approved || false);
    };

    fetchApprovalStatus();
  }, [user?.id]);

  const handleAcceptJobs = () => {
    if (!isApproved) return;
    
    toast({
      title: "Job Acceptance Enabled",
      description: "You're now accepting new job requests in your area.",
    });
  };

  const handleToggleAvailability = () => {
    setIsAvailable(!isAvailable);
    toast({
      title: isAvailable ? "Availability: OFF" : "Availability: ON",
      description: isAvailable 
        ? "You won't receive new job notifications." 
        : "You're now available for new jobs.",
    });
  };

  const handleViewMap = () => {
    toast({
      title: "Map View",
      description: "Opening job locations map...",
    });
    setTimeout(() => {
      window.open('https://maps.google.com', '_blank');
    }, 1000);
  };

  return (
    <GlowCard title="" icon={<span />} className="pt-2">
      <div className="space-y-4">
        <div className="relative">
          <button 
            onClick={handleAcceptJobs}
            disabled={!isApproved}
            title={!isApproved ? "Approval required before accepting jobs" : ""}
            className={`w-full rounded-full py-3 px-6 font-semibold transition-all duration-200 ${
              isApproved
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-60'
            }`}>
            Accept New Jobs
          </button>
        </div>
        <button 
          onClick={handleToggleAvailability}
          className={`w-full rounded-full border py-3 px-6 font-semibold transition-all duration-200 ${
            isAvailable 
              ? 'border-red-500/50 text-red-200 hover:border-red-500/70 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              : 'border-emerald-500/30 text-emerald-200 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'
          }`}>
          {isAvailable ? 'Turn Availability Off' : 'Turn Availability On'}
        </button>
        <button 
          onClick={handleViewMap}
          className="w-full rounded-full border border-emerald-500/30 hover:border-emerald-500/50 py-3 px-6 text-emerald-200 hover:text-emerald-100 transition-all duration-200 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          View Map
        </button>
      </div>
    </GlowCard>
  );
}