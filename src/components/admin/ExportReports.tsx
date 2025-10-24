import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Mail } from 'lucide-react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

interface ExportReportsProps {
  filters: {
    dateRange: string;
    serviceType: string;
    location: string;
  };
}

export const ExportReports: React.FC<ExportReportsProps> = ({ filters }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [selectedMetrics, setSelectedMetrics] = useState({
    revenue: true,
    users: true,
    jobs: true,
    commissions: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const { data } = useAnalyticsData(filters);

  const handleExport = async (format: string) => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (format === 'csv') {
        exportToCSV();
      } else if (format === 'pdf') {
        exportToPDF();
      } else if (format === 'email') {
        sendEmailReport();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    const csvData = generateCSVData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // In a real implementation, you'd use a library like jsPDF
    console.log('Exporting to PDF...');
    alert('PDF export would be implemented with a library like jsPDF');
  };

  const sendEmailReport = () => {
    // In a real implementation, you'd call an API to send the email
    console.log('Sending email report...');
    alert('Email report functionality would be implemented with an email service');
  };

  const generateCSVData = () => {
    let csv = 'Report Type,Date,Value\n';
    
    if (selectedMetrics.revenue && data?.revenueData) {
      data.revenueData.forEach(item => {
        csv += `Revenue,${item.date},${item.amount}\n`;
      });
    }
    
    if (selectedMetrics.users && data?.userGrowthData) {
      data.userGrowthData.forEach(item => {
        csv += `Clients,${item.date},${item.clients}\n`;
        csv += `Landscapers,${item.date},${item.landscapers}\n`;
      });
    }
    
    if (selectedMetrics.jobs && data?.jobData) {
      data.jobData.forEach(item => {
        csv += `Jobs Completed,${item.date},${item.completed}\n`;
        csv += `Total Jobs,${item.date},${item.total}\n`;
      });
    }
    
    if (selectedMetrics.commissions && data?.commissionData) {
      data.commissionData.forEach(item => {
        csv += `Commission,${item.landscaper},${item.commission}\n`;
      });
    }
    
    return csv;
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric as keyof typeof prev]
    }));
  };

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Quick Export'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('email')}>
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            Custom Export
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom Report Export</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Export Format</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Include Metrics</label>
              <div className="mt-2 space-y-2">
                {Object.entries(selectedMetrics).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox 
                      id={key}
                      checked={value}
                      onCheckedChange={() => toggleMetric(key)}
                    />
                    <label htmlFor={key} className="text-sm capitalize">
                      {key === 'users' ? 'User Growth' : key}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => handleExport(exportFormat)} 
              className="w-full"
              disabled={isExporting}
            >
              {isExporting ? 'Generating Report...' : 'Generate Report'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};