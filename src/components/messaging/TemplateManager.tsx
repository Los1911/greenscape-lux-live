import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Sparkles,
  User,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageTemplate,
  MessageTemplateUpdate,
  MAX_CUSTOM_TEMPLATES,
  MAX_TEMPLATE_CONTENT_LENGTH,
  MAX_TEMPLATE_NAME_LENGTH
} from '@/types/messageTemplate';
import { LANDSCAPER_MESSAGE_TYPES, CLIENT_MESSAGE_TYPES } from '@/components/messaging/StructuredJobMessaging';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  templates: MessageTemplate[];
  customTemplates: MessageTemplate[];
  systemTemplates: MessageTemplate[];
  canAddMore: boolean;
  customTemplateCount: number;
  onCreateTemplate: (template: { name: string; content: string; message_type: string | null }) => Promise<MessageTemplate | null>;
  onUpdateTemplate: (id: string, updates: MessageTemplateUpdate) => Promise<boolean>;
  onDeleteTemplate: (id: string) => Promise<boolean>;
}

export function TemplateManager({
  isOpen,
  onClose,
  customTemplates,
  systemTemplates,
  canAddMore,
  customTemplateCount,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate
}: TemplateManagerProps) {
  const { role } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', content: '', message_type: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get message types based on role
  const messageTypes = role === 'landscaper' ? LANDSCAPER_MESSAGE_TYPES : CLIENT_MESSAGE_TYPES;

  const resetForm = () => {
    setFormData({ name: '', content: '', message_type: '' });
    setIsCreating(false);
    setEditingId(null);
    setError(null);
  };

  const handleStartCreate = () => {
    if (!canAddMore) {
      setError(`Maximum of ${MAX_CUSTOM_TEMPLATES} custom templates allowed`);
      return;
    }
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (template: MessageTemplate) => {
    setFormData({
      name: template.name,
      content: template.content,
      message_type: template.message_type || ''
    });
    setEditingId(template.id);
    setIsCreating(false);
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Template name is required');
      return false;
    }
    if (formData.name.length > MAX_TEMPLATE_NAME_LENGTH) {
      setError(`Name must be ${MAX_TEMPLATE_NAME_LENGTH} characters or less`);
      return false;
    }
    if (!formData.content.trim()) {
      setError('Template content is required');
      return false;
    }
    if (formData.content.length > MAX_TEMPLATE_CONTENT_LENGTH) {
      setError(`Content must be ${MAX_TEMPLATE_CONTENT_LENGTH} characters or less`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const result = await onCreateTemplate({
          name: formData.name.trim(),
          content: formData.content.trim(),
          message_type: formData.message_type || null
        });
        if (result) {
          setSuccess('Template created successfully');
          resetForm();
        } else {
          setError('Failed to create template');
        }
      } else if (editingId) {
        const success = await onUpdateTemplate(editingId, {
          name: formData.name.trim(),
          content: formData.content.trim(),
          message_type: formData.message_type || null
        });
        if (success) {
          setSuccess('Template updated successfully');
          resetForm();
        } else {
          setError('Failed to update template');
        }
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setSaving(true);
    try {
      const success = await onDeleteTemplate(id);
      if (success) {
        setSuccess('Template deleted');
        if (editingId === id) {
          resetForm();
        }
      } else {
        setError('Failed to delete template');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Determine if form is visible (affects scroll area height)
  const isFormVisible = isCreating || editingId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-slate-950 border border-emerald-500/25 text-white max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="text-emerald-300 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Manage Quick Reply Templates
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain px-6"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            minHeight: 0 // Critical for flex child to shrink
          }}
        >
          {/* Status Messages */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-emerald-200 text-sm">{success}</span>
            </div>
          )}

          {/* Create/Edit Form */}
          {isFormVisible && (
            <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-4 space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-emerald-200">
                  {isCreating ? 'Create New Template' : 'Edit Template'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-emerald-200/70">Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., On My Way"
                    maxLength={MAX_TEMPLATE_NAME_LENGTH}
                    className="bg-slate-900/50 border-emerald-500/25 text-white mt-1"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {formData.name.length}/{MAX_TEMPLATE_NAME_LENGTH}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-emerald-200/70">Message Content</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Type your template message..."
                    maxLength={MAX_TEMPLATE_CONTENT_LENGTH}
                    className="bg-slate-900/50 border-emerald-500/25 text-white mt-1 min-h-[80px]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {formData.content.length}/{MAX_TEMPLATE_CONTENT_LENGTH}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-emerald-200/70">Message Type (Optional)</Label>
                  <Select
                    value={formData.message_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, message_type: value }))}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-emerald-500/25 text-white mt-1">
                      <SelectValue placeholder="Any message type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-emerald-500/25">
                      <SelectItem value="" className="text-slate-300">Any message type</SelectItem>
                      {messageTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id} className="text-slate-300">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Optionally link to a specific message type
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={resetForm}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Templates Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">My Templates</span>
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-300">
                  {customTemplateCount}/{MAX_CUSTOM_TEMPLATES}
                </Badge>
              </div>
              {!isFormVisible && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartCreate}
                  disabled={!canAddMore}
                  className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/30"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Template
                </Button>
              )}
            </div>

            {customTemplates.length === 0 ? (
              <div className="bg-slate-900/30 rounded-lg p-6 text-center">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No custom templates yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Create your own quick replies for faster messaging
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {customTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`bg-slate-900/50 border rounded-lg p-3 ${
                      editingId === template.id
                        ? 'border-emerald-500/50'
                        : 'border-emerald-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-emerald-100 truncate">
                            {template.name}
                          </p>
                          {template.message_type && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-400">
                              {messageTypes.find(t => t.id === template.message_type)?.label || template.message_type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {template.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(template)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-300"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Templates Section */}
          <div className="mt-6 space-y-2 pb-4">
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-emerald-200">Suggested Templates</span>
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">
                System
              </Badge>
            </div>
            <p className="text-xs text-slate-500 px-1 mb-2">
              These templates are provided by the platform and cannot be edited
            </p>

            <div className="space-y-2">
              {systemTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-slate-900/30 border border-slate-700/30 rounded-lg p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-300 truncate">
                          {template.name}
                        </p>
                        {template.message_type && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-500">
                            {messageTypes.find(t => t.id === template.message_type)?.label || template.message_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {template.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex justify-end px-6 py-4 border-t border-emerald-500/20 bg-slate-950">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/30"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateManager;
