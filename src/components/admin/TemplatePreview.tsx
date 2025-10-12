import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Smartphone, Monitor, Tablet } from 'lucide-react';
import { TemplateComponent } from './TemplateComponents';

interface TemplatePreviewProps {
  components: TemplateComponent[];
  templateType: string;
}

const sampleData = {
  user: { name: 'John Smith', email: 'john@example.com' },
  job: { title: 'Lawn Maintenance', date: 'March 15, 2024', address: '123 Main St, City, ST' },
  landscaper: { name: 'Mike Johnson' },
  company: { name: 'GreenScape Lux', phone: '(555) 123-4567' }
};

const deviceSizes = {
  desktop: { width: '100%', icon: Monitor },
  tablet: { width: '768px', icon: Tablet },
  mobile: { width: '375px', icon: Smartphone }
};

export default function TemplatePreview({ components, templateType }: TemplatePreviewProps) {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = useState('');

  const replaceVariables = (content: string): string => {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.split('.');
      let value: any = sampleData;
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      return value || match;
    });
  };

  const renderComponent = (component: TemplateComponent) => {
    const processedContent = replaceVariables(component.content);
    
    switch (component.type) {
      case 'header':
        return (
          <h1 className="text-2xl font-bold text-gray-900 mb-4" style={component.styles}>
            {processedContent}
          </h1>
        );
      case 'text':
        return (
          <p className="text-gray-700 mb-4 leading-relaxed" style={component.styles}>
            {processedContent}
          </p>
        );
      case 'button':
        return (
          <div className="mb-4">
            <button
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              style={component.styles}
            >
              {processedContent}
            </button>
          </div>
        );
      case 'image':
        return (
          <div className="mb-4">
            <img
              src={processedContent}
              alt="Email content"
              className="max-w-full h-auto rounded-lg"
              style={component.styles}
            />
          </div>
        );
      case 'spacer':
        return <div className="mb-8" style={{ height: '32px', ...component.styles }} />;
      default:
        return null;
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) return;
    
    // Implementation would send test email
    console.log('Sending test email to:', testEmail);
  };

  return (
    <div className="flex-1 bg-white">
      {/* Preview Controls */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold">Preview</h3>
          <div className="flex space-x-1">
            {Object.entries(deviceSizes).map(([device, { icon: Icon }]) => (
              <Button
                key={device}
                variant={previewDevice === device ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewDevice(device as any)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Input
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-48"
          />
          <Button onClick={sendTestEmail} size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Test Email
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-8 bg-gray-100 min-h-96 overflow-auto">
        <div 
          className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
          style={{ 
            width: deviceSizes[previewDevice].width,
            maxWidth: '100%'
          }}
        >
          <div className="p-8">
            {components.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Drag components here to build your email template</p>
              </div>
            ) : (
              components.map((component, index) => (
                <div key={`${component.id}-${index}`}>
                  {renderComponent(component)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}