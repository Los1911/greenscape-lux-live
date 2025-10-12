import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Mail, FileText, Settings } from 'lucide-react';

interface ScheduledReport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'excel' | 'csv';
  recipients: string[];
  enabled: boolean;
  nextRun: string;
  lastRun?: string;
  reportType: string;
}

export function ReportScheduler() {
  const [reports, setReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Weekly Revenue Report',
      frequency: 'weekly',
      format: 'pdf',
      recipients: ['admin@company.com', 'finance@company.com'],
      enabled: true,
      nextRun: '2024-03-25T09:00:00Z',
      lastRun: '2024-03-18T09:00:00Z',
      reportType: 'revenue'
    },
    {
      id: '2',
      name: 'Monthly Customer Analytics',
      frequency: 'monthly',
      format: 'excel',
      recipients: ['marketing@company.com'],
      enabled: true,
      nextRun: '2024-04-01T10:00:00Z',
      lastRun: '2024-03-01T10:00:00Z',
      reportType: 'customers'
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newReport, setNewReport] = useState<Partial<ScheduledReport>>({
    name: '',
    frequency: 'weekly',
    format: 'pdf',
    recipients: [],
    enabled: true,
    reportType: 'revenue'
  });

  const toggleReport = (id: string) => {
    setReports(reports.map(report => 
      report.id === id ? { ...report, enabled: !report.enabled } : report
    ));
  };

  const createReport = () => {
    if (!newReport.name || !newReport.recipients?.length) return;

    const report: ScheduledReport = {
      id: Date.now().toString(),
      name: newReport.name,
      frequency: newReport.frequency as ScheduledReport['frequency'],
      format: newReport.format as ScheduledReport['format'],
      recipients: newReport.recipients,
      enabled: newReport.enabled || true,
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      reportType: newReport.reportType || 'revenue'
    };

    setReports([...reports, report]);
    setNewReport({
      name: '',
      frequency: 'weekly',
      format: 'pdf',
      recipients: [],
      enabled: true,
      reportType: 'revenue'
    });
    setIsCreating(false);
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: 'bg-green-100 text-green-800',
      weekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-purple-100 text-purple-800'
    };
    return colors[frequency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Automated Reports</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Schedule and automate report delivery
              </p>
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create Report Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Report Name</label>
                <Input
                  value={newReport.name || ''}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  placeholder="Enter report name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Report Type</label>
                <Select
                  value={newReport.reportType}
                  onValueChange={(value) => setNewReport({ ...newReport, reportType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue Analytics</SelectItem>
                    <SelectItem value="customers">Customer Insights</SelectItem>
                    <SelectItem value="operations">Operations Summary</SelectItem>
                    <SelectItem value="performance">Performance Metrics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <Select
                  value={newReport.frequency}
                  onValueChange={(value) => setNewReport({ ...newReport, frequency: value as ScheduledReport['frequency'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Format</label>
                <Select
                  value={newReport.format}
                  onValueChange={(value) => setNewReport({ ...newReport, format: value as ScheduledReport['format'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Recipients (comma-separated emails)</label>
              <Input
                value={newReport.recipients?.join(', ') || ''}
                onChange={(e) => setNewReport({ 
                  ...newReport, 
                  recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                })}
                placeholder="admin@company.com, finance@company.com"
              />
            </div>
            <div className="flex space-x-3">
              <Button onClick={createReport}>Schedule Report</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold">{report.name}</h3>
                      <Badge className={getFrequencyBadge(report.frequency)}>
                        {report.frequency}
                      </Badge>
                      <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                      {report.enabled ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{report.recipients.length} recipient(s)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Next: {new Date(report.nextRun).toLocaleDateString()}</span>
                      </div>
                      {report.lastRun && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Last: {new Date(report.lastRun).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Recipients: {report.recipients.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={report.enabled}
                      onCheckedChange={() => toggleReport(report.id)}
                    />
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Executive Summary</h3>
                  <p className="text-sm text-gray-600">High-level business metrics</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">Financial Report</h3>
                  <p className="text-sm text-gray-600">Revenue and payment analytics</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Operations Report</h3>
                  <p className="text-sm text-gray-600">Job completion and efficiency</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold">Customer Report</h3>
                  <p className="text-sm text-gray-600">Customer behavior and satisfaction</p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}