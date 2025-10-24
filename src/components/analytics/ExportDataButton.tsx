import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { Download, FileText, BarChart3, Table } from 'lucide-react';

interface ExportDataButtonProps {
  timeRange: string;
}

export function ExportDataButton({ timeRange }: ExportDataButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportData = async (format: 'csv' | 'json' | 'pdf') => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-payment-analytics', {
        body: { timeRange, format }
      });

      if (error) throw error;

      // Create and download file
      const blob = new Blob([data.content], { 
        type: format === 'csv' ? 'text/csv' : format === 'json' ? 'application/json' : 'application/pdf'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-analytics-${timeRange}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportData('csv')}>
          <Table className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportData('json')}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportData('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}