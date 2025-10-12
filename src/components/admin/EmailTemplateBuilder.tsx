import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Mail, Eye, Save, Plus, Trash2 } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  variables: string[];
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Failed Payment Alert',
    subject: 'ALERT: {{failedCount}} Failed Payments Detected',
    htmlContent: `
      <h2>Payment Failure Alert</h2>
      <p>We've detected {{failedCount}} failed payments in the last hour.</p>
      <p><strong>Severity:</strong> {{severity}}</p>
      <p><strong>Time:</strong> {{timestamp}}</p>
      <p>Please investigate immediately.</p>
    `,
    textContent: `Payment Failure Alert\n\nWe've detected {{failedCount}} failed payments in the last hour.\nSeverity: {{severity}}\nTime: {{timestamp}}\n\nPlease investigate immediately.`,
    severity: 'high',
    variables: ['failedCount', 'severity', 'timestamp']
  },
  {
    id: '2',
    name: 'Webhook Failure Alert',
    subject: 'CRITICAL: Webhook Failures Detected',
    htmlContent: `
      <h2>Webhook Failure Alert</h2>
      <p>{{webhookFailures}} webhook failures detected.</p>
      <p><strong>Endpoint:</strong> {{endpoint}}</p>
      <p><strong>Error:</strong> {{error}}</p>
      <p>Immediate action required.</p>
    `,
    textContent: `Webhook Failure Alert\n\n{{webhookFailures}} webhook failures detected.\nEndpoint: {{endpoint}}\nError: {{error}}\n\nImmediate action required.`,
    severity: 'critical',
    variables: ['webhookFailures', 'endpoint', 'error']
  }
];

export function EmailTemplateBuilder() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({
    failedCount: '5',
    severity: 'high',
    timestamp: new Date().toISOString(),
    webhookFailures: '3',
    endpoint: '/webhook/stripe',
    error: 'Connection timeout'
  });

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;

    if (isEditing) {
      setTemplates(prev => 
        prev.map(t => t.id === selectedTemplate.id ? selectedTemplate : t)
      );
    } else {
      const newTemplate = {
        ...selectedTemplate,
        id: Date.now().toString()
      };
      setTemplates(prev => [...prev, newTemplate]);
    }

    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }
  };

  const handleNewTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: '',
      name: 'New Template',
      subject: '',
      htmlContent: '',
      textContent: '',
      severity: 'medium',
      variables: []
    };
    setSelectedTemplate(newTemplate);
    setIsEditing(false);
  };

  const renderPreview = (content: string): string => {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return previewData[key] || match;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Template List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Templates
            </CardTitle>
            <Button onClick={handleNewTemplate} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.map(template => (
              <div 
                key={template.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsEditing(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-500 truncate">{template.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(template.severity)}>
                      {template.severity}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Editor */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {isEditing ? 'Edit Template' : 'New Template'}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={handleSaveTemplate} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name</label>
                <Input
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    name: e.target.value
                  })}
                  placeholder="Template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Severity</label>
                <Select
                  value={selectedTemplate.severity}
                  onValueChange={(value: any) => setSelectedTemplate({
                    ...selectedTemplate,
                    severity: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject Line</label>
                <Input
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    subject: e.target.value
                  })}
                  placeholder="Email subject with {{variables}}"
                />
              </div>

              <Tabs defaultValue="html" className="w-full">
                <TabsList>
                  <TabsTrigger value="html">HTML Content</TabsTrigger>
                  <TabsTrigger value="text">Text Content</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="html">
                  <Textarea
                    value={selectedTemplate.htmlContent}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      htmlContent: e.target.value
                    })}
                    placeholder="HTML email content with {{variables}}"
                    className="min-h-[200px]"
                  />
                </TabsContent>
                
                <TabsContent value="text">
                  <Textarea
                    value={selectedTemplate.textContent}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      textContent: e.target.value
                    })}
                    placeholder="Plain text email content with {{variables}}"
                    className="min-h-[200px]"
                  />
                </TabsContent>
                
                <TabsContent value="preview">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="mb-4">
                      <strong>Subject:</strong> {renderPreview(selectedTemplate.subject)}
                    </div>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: renderPreview(selectedTemplate.htmlContent) 
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}