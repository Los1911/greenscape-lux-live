import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Plus, X } from 'lucide-react';

interface Variable {
  key: string;
  label: string;
  description: string;
  category: string;
}

const predefinedVariables: Variable[] = [
  { key: 'user.name', label: 'User Name', description: 'Full name of the user', category: 'User' },
  { key: 'user.email', label: 'User Email', description: 'Email address', category: 'User' },
  { key: 'job.title', label: 'Job Title', description: 'Title of the job', category: 'Job' },
  { key: 'job.date', label: 'Job Date', description: 'Scheduled date', category: 'Job' },
  { key: 'job.address', label: 'Job Address', description: 'Service location', category: 'Job' },
  { key: 'landscaper.name', label: 'Landscaper Name', description: 'Assigned landscaper', category: 'Landscaper' },
  { key: 'company.name', label: 'Company Name', description: 'Business name', category: 'Company' },
  { key: 'company.phone', label: 'Company Phone', description: 'Contact number', category: 'Company' }
];

interface VariableInserterProps {
  onInsertVariable: (variable: string) => void;
}

export default function VariableInserter({ onInsertVariable }: VariableInserterProps) {
  const [customVariable, setCustomVariable] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(predefinedVariables.map(v => v.category)))];

  const filteredVariables = selectedCategory === 'All' 
    ? predefinedVariables 
    : predefinedVariables.filter(v => v.category === selectedCategory);

  const handleInsertVariable = (key: string) => {
    onInsertVariable(`{{${key}}}`);
  };

  const handleInsertCustomVariable = () => {
    if (customVariable.trim()) {
      onInsertVariable(`{{${customVariable.trim()}}}`);
      setCustomVariable('');
    }
  };

  return (
    <div className="p-4 bg-gray-50 border-l">
      <h3 className="font-semibold mb-4">Variables</h3>
      
      {/* Category Filter */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Predefined Variables */}
      <div className="space-y-2 mb-4">
        {filteredVariables.map(variable => (
          <div
            key={variable.key}
            className="p-2 bg-white border rounded cursor-pointer hover:bg-gray-50"
            onClick={() => handleInsertVariable(variable.key)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm">{variable.label}</div>
                <div className="text-xs text-gray-500">{variable.description}</div>
              </div>
              <Copy className="h-3 w-3 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Custom Variable */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-2">Custom Variable</h4>
        <div className="flex space-x-2">
          <Input
            placeholder="variable.name"
            value={customVariable}
            onChange={(e) => setCustomVariable(e.target.value)}
            className="text-sm"
          />
          <Button size="sm" onClick={handleInsertCustomVariable}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}