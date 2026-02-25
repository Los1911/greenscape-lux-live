import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Code, Shield } from 'lucide-react';

interface PolicyTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
}

const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    name: 'User Own Data',
    description: 'Users can only access their own records',
    template: `CREATE POLICY "{table}_own_data" ON {table}
  FOR ALL USING (auth.uid() = {user_column});`,
    variables: ['table', 'user_column']
  },
  {
    name: 'Admin Full Access',
    description: 'Admin users have full access to all records',
    template: `CREATE POLICY "{table}_admin_access" ON {table}
  FOR ALL USING (is_admin(auth.uid()));`,
    variables: ['table']
  },
  {
    name: 'Anonymous Insert Only',
    description: 'Anonymous users can insert but not read/update/delete',
    template: `CREATE POLICY "{table}_anon_insert" ON {table}
  FOR INSERT TO anon
  WITH CHECK (true);`,
    variables: ['table']
  },
  {
    name: 'Service Role Full Access',
    description: 'Service role has complete access (for Edge Functions)',
    template: `CREATE POLICY "{table}_service_access" ON {table}
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);`,
    variables: ['table']
  },
  {
    name: 'Role-Based Access',
    description: 'Access based on user role column',
    template: `CREATE POLICY "{table}_role_access" ON {table}
  FOR ALL USING (
    auth.jwt() ->> 'role' = '{role}' OR
    is_admin(auth.uid())
  );`,
    variables: ['table', 'role']
  }
];

export function RLSPolicyGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generatedPolicy, setGeneratedPolicy] = useState('');

  const handleTemplateSelect = (templateName: string) => {
    const template = POLICY_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      setSelectedTemplate(template);
      const newVariables: Record<string, string> = {};
      template.variables.forEach(variable => {
        newVariables[variable] = '';
      });
      setVariables(newVariables);
      setGeneratedPolicy('');
    }
  };

  const generatePolicy = () => {
    if (!selectedTemplate) return;

    let policy = selectedTemplate.template;
    Object.entries(variables).forEach(([key, value]) => {
      policy = policy.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    setGeneratedPolicy(policy);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPolicy);
  };

  const getCommonTables = () => [
    'clients', 'landscapers', 'jobs', 'job_photos', 'quotes',
    'quote_requests', 'communications', 'notifications',
    'landscaper_documents', 'admin_sessions'
  ];

  const getCommonUserColumns = () => [
    'user_id', 'auth_user_id', 'client_id', 'landscaper_id', 'owner_id'
  ];

  const getCommonRoles = () => [
    'client', 'landscaper', 'admin', 'super_admin'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            RLS Policy Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Policy Template</label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a policy template..." />
              </SelectTrigger>
              <SelectContent>
                {POLICY_TEMPLATES.map(template => (
                  <SelectItem key={template.name} value={template.name}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Template Variables</h4>
                <div className="space-y-3">
                  {selectedTemplate.variables.map(variable => (
                    <div key={variable}>
                      <label className="block text-sm font-medium mb-1 capitalize">
                        {variable.replace('_', ' ')}
                      </label>
                      {variable === 'table' ? (
                        <Select 
                          onValueChange={(value) => 
                            setVariables(prev => ({ ...prev, [variable]: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select table..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getCommonTables().map(table => (
                              <SelectItem key={table} value={table}>{table}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : variable.includes('column') ? (
                        <Select 
                          onValueChange={(value) => 
                            setVariables(prev => ({ ...prev, [variable]: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getCommonUserColumns().map(column => (
                              <SelectItem key={column} value={column}>{column}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : variable === 'role' ? (
                        <Select 
                          onValueChange={(value) => 
                            setVariables(prev => ({ ...prev, [variable]: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getCommonRoles().map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={variables[variable] || ''}
                          onChange={(e) => 
                            setVariables(prev => ({ ...prev, [variable]: e.target.value }))
                          }
                          placeholder={`Enter ${variable}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={generatePolicy} className="w-full">
                Generate Policy
              </Button>
            </div>
          )}

          {generatedPolicy && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Generated Policy</h4>
                <Button onClick={copyToClipboard} size="sm" variant="outline">
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={generatedPolicy}
                readOnly
                className="font-mono text-sm"
                rows={6}
              />
              <div className="text-xs text-gray-500">
                Copy this SQL and run it in your Supabase SQL Editor
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            RLS Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="outline">1</Badge>
              <div className="text-sm">
                <strong>Always enable RLS:</strong> Use <code>ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;</code>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline">2</Badge>
              <div className="text-sm">
                <strong>Service role bypass:</strong> Service role policies should use <code>USING (true)</code>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline">3</Badge>
              <div className="text-sm">
                <strong>Test policies:</strong> Always test with different user roles before production
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline">4</Badge>
              <div className="text-sm">
                <strong>Admin function:</strong> Create <code>is_admin(uuid)</code> function for admin checks
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}