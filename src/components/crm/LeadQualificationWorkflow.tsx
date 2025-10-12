import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Clock, AlertCircle, User, Phone, Mail } from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
}

interface QualifiedLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  score: number;
  source: string;
  priority: 'high' | 'medium' | 'low';
  workflow: WorkflowStep[];
  assignedSalesRep?: string;
  lastContact?: string;
  nextAction?: string;
}

export const LeadQualificationWorkflow: React.FC = () => {
  const [leads, setLeads] = useState<QualifiedLead[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '(555) 123-4567',
      score: 92,
      source: 'quote-form',
      priority: 'high',
      assignedSalesRep: 'Carlos Rodriguez',
      lastContact: '2024-01-20',
      nextAction: 'Schedule consultation call',
      workflow: [
        { id: '1', name: 'Initial Contact', status: 'completed' },
        { id: '2', name: 'Needs Assessment', status: 'completed' },
        { id: '3', name: 'Quote Preparation', status: 'in-progress', assignedTo: 'Carlos Rodriguez', dueDate: '2024-01-22' },
        { id: '4', name: 'Proposal Review', status: 'pending' },
        { id: '5', name: 'Contract Negotiation', status: 'pending' }
      ]
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@example.com',
      score: 78,
      source: 'website',
      priority: 'medium',
      assignedSalesRep: 'Bradley Thompson',
      lastContact: '2024-01-19',
      nextAction: 'Follow up on quote interest',
      workflow: [
        { id: '1', name: 'Initial Contact', status: 'completed' },
        { id: '2', name: 'Needs Assessment', status: 'in-progress', assignedTo: 'Bradley Thompson', dueDate: '2024-01-21' },
        { id: '3', name: 'Quote Preparation', status: 'pending' },
        { id: '4', name: 'Proposal Review', status: 'pending' },
        { id: '5', name: 'Contract Negotiation', status: 'pending' }
      ]
    }
  ]);

  const [selectedLead, setSelectedLead] = useState<QualifiedLead | null>(null);
  const [workflowNotes, setWorkflowNotes] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const updateWorkflowStep = (leadId: string, stepId: string, status: string) => {
    setLeads(leads.map(lead => 
      lead.id === leadId 
        ? {
            ...lead,
            workflow: lead.workflow.map(step =>
              step.id === stepId ? { ...step, status: status as any } : step
            )
          }
        : lead
    ));
  };

  const assignSalesRep = (leadId: string, salesRep: string) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, assignedSalesRep: salesRep } : lead
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lead Qualification Workflow</h2>
        <p className="text-muted-foreground">Manage qualified leads through the sales process</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Qualified Leads</h3>
          {leads.map((lead) => (
            <Card 
              key={lead.id} 
              className={`cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setSelectedLead(lead)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{lead.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {lead.email}
                      {lead.phone && (
                        <>
                          <Phone className="h-3 w-3 ml-2" />
                          {lead.phone}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{lead.score}</div>
                    <Badge className={getPriorityColor(lead.priority)}>
                      {lead.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {lead.assignedSalesRep || 'Unassigned'}
                  </div>
                  <div className="text-muted-foreground">
                    Source: {lead.source}
                  </div>
                </div>

                {/* Workflow Progress */}
                <div className="mt-3 flex gap-1">
                  {lead.workflow.map((step) => (
                    <div
                      key={step.id}
                      className={`h-2 flex-1 rounded ${
                        step.status === 'completed' ? 'bg-green-500' :
                        step.status === 'in-progress' ? 'bg-blue-500' :
                        'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lead Details */}
        {selectedLead && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedLead.name}
                  <Badge className={getPriorityColor(selectedLead.priority)}>
                    {selectedLead.priority.toUpperCase()} PRIORITY
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Assigned Sales Rep</label>
                  <Select 
                    value={selectedLead.assignedSalesRep || ''} 
                    onValueChange={(value) => assignSalesRep(selectedLead.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales rep" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Carlos Rodriguez">Carlos Rodriguez</SelectItem>
                      <SelectItem value="Bradley Thompson">Bradley Thompson</SelectItem>
                      <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Next Action</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedLead.nextAction}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Workflow Steps</label>
                  <div className="space-y-2 mt-2">
                    {selectedLead.workflow.map((step) => (
                      <div key={step.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(step.status)}
                          <span className="text-sm">{step.name}</span>
                        </div>
                        <Select
                          value={step.status}
                          onValueChange={(value) => updateWorkflowStep(selectedLead.id, step.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="skipped">Skipped</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={workflowNotes}
                    onChange={(e) => setWorkflowNotes(e.target.value)}
                    placeholder="Add notes about this lead..."
                    className="mt-1"
                  />
                  <Button size="sm" className="mt-2">Save Notes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};