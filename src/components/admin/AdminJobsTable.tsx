import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Settings2,
  ChevronDown,
  Eye,
  User,
} from 'lucide-react';
import {
  type AdminBucket,
  ADMIN_BUCKET_CONFIG,
} from '@/lib/jobLifecycleContract';

/* ----------------------------------------
   Types
---------------------------------------- */

interface Job {
  id: string;
  service_type: string;
  service_name?: string;
  lifecycle: AdminBucket;
  status: string;
  assigned_to?: string | null;
  landscaper_id?: string | null;
  landscaper_email?: string | null;
  client_email?: string | null;
  price?: number | null;
  created_at: string;
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  minWidth?: string;
}

interface AdminJobsTableProps {
  jobs: Job[];
  onJobClick?: (job: Job) => void;
}

/* ----------------------------------------
   Lifecycle Badge
---------------------------------------- */

const BUCKET_ICON_MAP: Record<AdminBucket, React.ElementType> = {
  needs_pricing: Clock,
  ready_to_release: Eye,
  active: User,
  pending_review: AlertTriangle,
  completed: CheckCircle,
  exceptions: AlertCircle,
  unclassified: AlertCircle,
};

const getLifecycleBadge = (lifecycle: AdminBucket) => {
  const config = ADMIN_BUCKET_CONFIG[lifecycle];
  const Icon = BUCKET_ICON_MAP[lifecycle] ?? AlertCircle;

  if (!config) {
    return (
      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50 whitespace-nowrap">
        Unclassified
      </Badge>
    );
  }

  return (
    <Badge className={`${config.bgColor} ${config.color} whitespace-nowrap`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

/* ----------------------------------------
   Helpers
---------------------------------------- */

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const truncate = (text?: string | null, maxLength = 20) => {
  if (!text) return '-';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

/* ----------------------------------------
   Component
---------------------------------------- */

export function AdminJobsTable({ jobs, onJobClick }: AdminJobsTableProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'service', label: 'Service', visible: true, minWidth: '180px' },
    { id: 'lifecycle', label: 'Lifecycle', visible: true, minWidth: '140px' },
    { id: 'client', label: 'Client', visible: true, minWidth: '160px' },
    { id: 'landscaper', label: 'Landscaper', visible: true, minWidth: '160px' },
    { id: 'price', label: 'Price', visible: true, minWidth: '100px' },
    { id: 'created', label: 'Created', visible: true, minWidth: '120px' },
  ]);

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const toggleColumn = (columnId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const visibleColumns = columns.filter(c => c.visible);

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No jobs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Column Toggle */}
      <div className="flex justify-end relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowColumnMenu(!showColumnMenu)}
          className="text-emerald-300/70 hover:text-emerald-300 hover:bg-emerald-500/10"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Columns
          <ChevronDown
            className={`w-4 h-4 ml-1 transition-transform ${
              showColumnMenu ? 'rotate-180' : ''
            }`}
          />
        </Button>

        {showColumnMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowColumnMenu(false)}
            />
            <div className="absolute top-full right-0 mt-1 bg-black/95 backdrop-blur border border-emerald-500/30 rounded-lg z-50 py-2 min-w-[160px] shadow-xl">
              {columns.map(col => (
                <button
                  key={col.id}
                  onClick={() => toggleColumn(col.id)}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-emerald-500/10"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      col.visible
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-emerald-500/50'
                    }`}
                  >
                    {col.visible && (
                      <CheckCircle className="w-3 h-3 text-black" />
                    )}
                  </span>
                  <span
                    className={
                      col.visible ? 'text-emerald-300' : 'text-emerald-300/50'
                    }
                  >
                    {col.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-emerald-500/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/80 border-b border-emerald-500/20">
                {visibleColumns.map(col => (
                  <th
                    key={col.id}
                    className="text-left py-3 px-4 text-sm font-medium text-gray-400"
                    style={{ minWidth: col.minWidth }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr
                  key={job.id}
                  onClick={() => onJobClick?.(job)}
                  className="border-b border-emerald-500/10 hover:bg-emerald-500/5 cursor-pointer transition-colors"
                >
                  {visibleColumns.some(c => c.id === 'service') && (
                    <td className="py-3 px-4 text-white">
                      {job.service_type || job.service_name || 'Service'}
                    </td>
                  )}

                  {visibleColumns.some(c => c.id === 'lifecycle') && (
                    <td className="py-3 px-4">
                      {getLifecycleBadge(job.lifecycle)}
                    </td>
                  )}

                  {visibleColumns.some(c => c.id === 'client') && (
                    <td className="py-3 px-4 text-gray-300">
                      {truncate(job.client_email, 22)}
                    </td>
                  )}

                  {visibleColumns.some(c => c.id === 'landscaper') && (
                    <td className="py-3 px-4 text-blue-300">
                      {job.landscaper_email
                        ? truncate(job.landscaper_email, 22)
                        : job.landscaper_id
                          ? truncate(job.landscaper_id, 12)
                          : 'Unassigned'}
                    </td>
                  )}

                  {visibleColumns.some(c => c.id === 'price') && (
                    <td className="py-3 px-4 text-emerald-400 font-medium">
                      {job.price ? `$${job.price}` : '-'}
                    </td>
                  )}

                  {visibleColumns.some(c => c.id === 'created') && (
                    <td className="py-3 px-4 text-gray-400">
                      {formatDate(job.created_at)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminJobsTable;