import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Save, Copy, Trash2, Plus } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'welcome' | 'follow-up' | 'retention' | 'promotional';
  content: string;
  variables: string[];
  lastModified: string;
}

const EmailTemplateBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Welcome Series - Email 1',
      subject: 'Welcome to GreenScape Lux!',
      type: 'welcome',
      content: 'Hi {{firstName}},\n\nWelcome to GreenScape Lux! We\'re excited to help transform your outdoor space.',
      variables: ['firstName', 'lastName'],
      lastModified: '2024-01-15'
    },
    {
      id: '2',
      name: 'Quote Follow-up',
      subject: 'Your landscaping quote is ready',
      type: 'follow-up',
      content: 'Hi {{firstName}},\n\nThank you for your interest in our services. Your quote for {{serviceType}} is attached.',
      variables: ['firstName', 'serviceType', 'quoteAmount'],
      lastModified: '2024-01-14'
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveTemplate = () => {
    if (selectedTemplate) {
      setTemplates(prev => 
        prev.map(t => t.id === selectedTemplate.id ? selectedTemplate : t)
      );
      setIsEditing(false);
    }
  };

  const handleCreateNew = () => {
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: 'New Template',
      subject: '',
      type: 'promotional',
      content: '',
      variables: [],
      lastModified: new Date().toISOString().split('T')[0]
    };
    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">Create and manage email templates for campaigns</p>
        </div>
        <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Select a template to edit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id 
                      ? 'bg-green-50 border-green-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.subject}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {isEditing ? 'Edit Template' : selectedTemplate.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    {isEditing ? (
                      <Button onClick={handleSaveTemplate} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    ) : (
                      <Button onClick={() => setIsEditing(true)} size="sm">
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={selectedTemplate.name}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        name: e.target.value
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-type">Type</Label>
                    <Select
                      value={selectedTemplate.type}
                      onValueChange={(value: any) => setSelectedTemplate({
                        ...selectedTemplate,
                        type: value
                      })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="retention">Retention</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      subject: e.target.value
                    })}
                    disabled={!isEditing}
                    placeholder="Enter email subject..."
                  />
                </div>

                <div>
                  <Label htmlFor="content">Email Content</Label>
                  <Textarea
                    id="content"
                    value={selectedTemplate.content}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      content: e.target.value
                    })}
                    disabled={!isEditing}
                    placeholder="Enter email content..."
                    rows={12}
                  />
                </div>

                <div>
                  <Label>Available Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['firstName', 'lastName', 'email', 'serviceType', 'quoteAmount', 'companyName'].map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a template to edit</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateBuilder;