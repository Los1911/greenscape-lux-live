import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CSVExportButtonProps {
  type: 'jobs' | 'revenue';
  className?: string;
}

export default function CSVExportButton({ type, className }: CSVExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const exportToCSV = async () => {
    setLoading(true);
    try {
      if (type === 'jobs') {
        const { data: jobs, error } = await supabase
          .from('jobs')
          .select('id, service_name, client_email, landscaper_email, status, price, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (jobs && jobs.length > 0) {
          const csvContent = [
            ['ID', 'Service', 'Client Email', 'Landscaper Email', 'Status', 'Price', 'Created At'].join(','),
            ...jobs.map(job => [
              job.id,
              job.service_name || '',
              job.client_email || '',
              job.landscaper_email || '',
              job.status || '',
              job.price || 0,
              job.created_at || ''
            ].join(','))
          ].join('\n');

          downloadCSV(csvContent, 'jobs-export.csv');
        } else {
          alert('No jobs data to export');
        }
      } else if (type === 'revenue') {
        const { data: jobs, error } = await supabase
          .from('jobs')
          .select('id, service_name, price, created_at')
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (jobs && jobs.length > 0) {
          const csvContent = [
            ['Date', 'Job ID', 'Service', 'Price', 'Platform Fee', 'Landscaper Payout'].join(','),
            ...jobs.map(job => [
              job.created_at?.split('T')[0] || '',
              job.id,
              job.service_name || '',
              job.price || 0,
              ((job.price || 0) * 0.15).toFixed(2),
              ((job.price || 0) * 0.85).toFixed(2)
            ].join(','))
          ].join('\n');

          downloadCSV(csvContent, 'revenue-export.csv');
        } else {
          alert('No completed jobs data to export');
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      onClick={exportToCSV}
      disabled={loading}
      className={`bg-green-600/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 hover:text-green-300 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Download className="h-4 w-4 mr-2" />
      {loading ? 'Exporting...' : `Export ${type === 'jobs' ? 'Jobs' : 'Revenue'} CSV`}
    </Button>
  );
}
