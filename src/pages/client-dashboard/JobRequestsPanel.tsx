import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobsOverviewSection } from '@/components/client/JobsOverviewSection';
import { MyJobsSection } from '@/components/client/MyJobsSection';
import { ScheduleServiceModal } from '@/components/client/ScheduleServiceModal';
import { ServiceAreasModal } from '@/components/client/ServiceAreasModal';
import { Plus, Calendar, MapPin } from 'lucide-react';

// refreshTrigger prop removed — each child now owns its own realtime subscription
export const JobRequestsPanel: React.FC = () => {
  const navigate = useNavigate();
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [areasModalOpen, setAreasModalOpen] = useState(false);

  const handleNewRequest = () => {
    navigate('/client-quote');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Job Requests</h1>
          <p className="text-gray-400 mt-1">Manage your service requests and track progress</p>
        </div>
        <button onClick={handleNewRequest}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all duration-200">
          <Plus className="h-5 w-5" />New Request
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={handleNewRequest}
          className="p-6 rounded-2xl bg-black/60 backdrop-blur border border-emerald-500/25 hover:border-emerald-400/40 transition-all duration-200 text-left group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30">
              <Plus className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Request Service</h3>
          </div>
          <p className="text-gray-400 text-sm">Request an estimate for landscaping services</p>
        </button>

        <button onClick={() => setScheduleModalOpen(true)}
          className="p-6 rounded-2xl bg-black/60 backdrop-blur border border-emerald-500/25 hover:border-emerald-400/40 transition-all duration-200 text-left group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Schedule Service</h3>
          </div>
          <p className="text-gray-400 text-sm">Book recurring maintenance</p>
        </button>

        <button onClick={() => setAreasModalOpen(true)}
          className="p-6 rounded-2xl bg-black/60 backdrop-blur border border-emerald-500/25 hover:border-emerald-400/40 transition-all duration-200 text-left group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Service Areas</h3>
          </div>
          <p className="text-gray-400 text-sm">View available service locations</p>
        </button>
      </div>

      {/* Jobs Overview Stats — owns its own realtime subscription */}
      <div className="w-full">
        <JobsOverviewSection />
      </div>

      {/* My Jobs Section — owns its own realtime subscription */}
      <div className="w-full">
        <MyJobsSection />
      </div>

      <ScheduleServiceModal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} />
      <ServiceAreasModal isOpen={areasModalOpen} onClose={() => setAreasModalOpen(false)} />
    </div>
  );
};

export default JobRequestsPanel;
