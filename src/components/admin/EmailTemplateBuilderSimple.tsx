import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  html_content: string;
  version: number;
}

const templateTypes = ['profile_confirmation', 'job_assignment', 'job_completion', 'appointment_reminder', 'welcome_email', 'password_reset'];
const variables = [
  { key: 'user.name', label: 'User Name' },
  { key: 'user.email', label: 'User Email' },
  { key: 'job.title', label: 'Job Title' },
  { key: 'job.date', label: 'Job Date' },
  { key: 'landscaper.name', label: 'Landscaper Name' },
  { key: 'company.name', label: 'Company Name' }
];

export default function EmailTemplateBuilderSimple() {
  const { user, loading: authLoading } = useAuth();
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
      const { data, error } = await supabase.from('email_templates').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadTemplates();
  }, [authLoading, user, loadTemplates]);

  const saveTemplate = async () => {
    if (!templateName || !templateType || !templateSubject) return;
    setLoading(true);
    try {
      const templateData = { name: templateName, type: templateType, subject: templateSubject, html_content: htmlContent, version: currentTemplate ? currentTemplate.version + 1 : 1 };
      if (currentTemplate) {
        await supabase.from('email_templates').update(templateData).eq('id', currentTemplate.id);
      } else {
        await supabase.from('email_templates').insert([templateData]);
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
    setTemplateName(template.name || '');
    setTemplateType(template.type || '');
    setTemplateSubject(template.subject || '');
    setHtmlContent(template.html_content || '');
  };

  const newTemplate = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setTemplateType('');
    setTemplateSubject('');
    setHtmlContent('<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;"><h1>{{company.name}}</h1><p>Hello {{user.name}},</p></div>');
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><RefreshCw className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center"><p className="text-gray-500">Please sign in to manage email templates.</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900">Email Template Builder</h1></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Templates</CardTitle><Button onClick={newTemplate} size="sm"><Plus className="h-4 w-4 mr-2" />New</Button></CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {templates.map(template => (
                <div key={template.id} className="p-3 border rounded cursor-pointer hover:bg-gray-50" onClick={() => loadTemplate(template)}>
                  <div className="font-medium">{template.name || 'Untitled'}</div>
                  <div className="text-sm text-gray-500">{template.type}</div>
                  <Badge variant="outline" className="text-xs">v{template.version}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Editor</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}><Eye className="h-4 w-4 mr-2" />{previewMode ? 'Edit' : 'Preview'}</Button>
                  <Button onClick={saveTemplate} disabled={loading}><Save className="h-4 w-4 mr-2" />Save</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!previewMode ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Template Name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                    <Select value={templateType} onValueChange={setTemplateType}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger><SelectContent>{templateTypes.map(type => <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <Input placeholder="Subject" value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} />
                  <div className="flex flex-wrap gap-2">{variables.map(v => <Badge key={v.key} variant="outline" className="cursor-pointer" onClick={() => setHtmlContent(prev => prev + `{{${v.key}}}`)}>{v.label}</Badge>)}</div>
                  <Textarea placeholder="HTML Content" value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} rows={12} className="font-mono text-sm" />
                </>
              ) : (
                <div className="border rounded-lg p-4 bg-white min-h-96" dangerouslySetInnerHTML={{ __html: htmlContent }} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
