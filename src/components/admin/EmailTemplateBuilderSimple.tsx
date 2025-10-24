import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, Copy, Trash2, Plus, Type, Image, Layout } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  html_content: string;
  version: number;
  created_at: string;
  updated_at: string;
}

const templateTypes = [
  'profile_confirmation',
  'job_assignment', 
  'job_completion',
  'appointment_reminder',
  'welcome_email',
  'password_reset'
];

const variables = [
  { key: 'user.name', label: 'User Name' },
  { key: 'user.email', label: 'User Email' },
  { key: 'job.title', label: 'Job Title' },
  { key: 'job.date', label: 'Job Date' },
  { key: 'job.address', label: 'Job Address' },
  { key: 'landscaper.name', label: 'Landscaper Name' },
  { key: 'company.name', label: 'Company Name' },
  { key: 'company.phone', label: 'Company Phone' }
];

export default function EmailTemplateBuilderSimple() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  React.useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const saveTemplate = async () => {
    if (!templateName || !templateType || !templateSubject) return;

    setLoading(true);
    try {
      const templateData = {
        name: templateName,
        type: templateType,
        subject: templateSubject,
        html_content: htmlContent,
        version: currentTemplate ? currentTemplate.version + 1 : 1
      };

      if (currentTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', currentTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert([templateData]);
        if (error) throw error;
      }

      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setTemplateName(template.name);
    setTemplateType(template.type);
    setTemplateSubject(template.subject);
    setHtmlContent(template.html_content);
  };

  const newTemplate = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setTemplateType('');
    setTemplateSubject('');
    setHtmlContent(getDefaultTemplate());
  };

  const insertVariable = (variable: string) => {
    setHtmlContent(prev => prev + `{{${variable}}}`);
  };

  const getDefaultTemplate = () => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">{{company.name}}</h1>
  <p>Hello {{user.name}},</p>
  <p>This is a notification email.</p>
  <p>Best regards,<br>The {{company.name}} Team</p>
</div>`;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email Template Builder</h1>
          <p className="text-gray-600 mt-2">Create and manage email templates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <Button onClick={newTemplate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => loadTemplate(template)}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500">{template.type}</div>
                  <Badge variant="outline" className="text-xs">
                    v{template.version}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Template Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Template Editor</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {previewMode ? 'Edit' : 'Preview'}
                  </Button>
                  <Button onClick={saveTemplate} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!previewMode ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Template Name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                    <Select value={templateType} onValueChange={setTemplateType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Template Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Email Subject"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                  />
                  <div>
                    <label className="text-sm font-medium mb-2 block">Variables</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {variables.map(variable => (
                        <Badge
                          key={variable.key}
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => insertVariable(variable.key)}
                        >
                          {variable.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    placeholder="HTML Content"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </>
              ) : (
                <div className="border rounded-lg p-4 bg-white min-h-96">
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}