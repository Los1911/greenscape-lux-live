import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageTemplate,
  MessageTemplateInsert,
  MessageTemplateUpdate,
  DEFAULT_LANDSCAPER_TEMPLATES,
  DEFAULT_CLIENT_TEMPLATES,
  MAX_CUSTOM_TEMPLATES
} from '@/types/messageTemplate';

interface UseMessageTemplatesReturn {
  templates: MessageTemplate[];
  customTemplates: MessageTemplate[];
  systemTemplates: MessageTemplate[];
  loading: boolean;
  error: string | null;
  canAddMore: boolean;
  customTemplateCount: number;
  createTemplate: (template: Omit<MessageTemplateInsert, 'user_id'>) => Promise<MessageTemplate | null>;
  updateTemplate: (id: string, updates: MessageTemplateUpdate) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  reorderTemplates: (templateIds: string[]) => Promise<boolean>;
  refreshTemplates: () => Promise<void>;
}

export function useMessageTemplates(): UseMessageTemplatesReturn {
  const { user, role } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get default templates based on role
  const getDefaultTemplates = useCallback(() => {
    if (role === 'landscaper') {
      return DEFAULT_LANDSCAPER_TEMPLATES;
    } else if (role === 'client') {
      return DEFAULT_CLIENT_TEMPLATES;
    }
    return [];
  }, [role]);

  // Fetch templates from database
  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Combine user templates with default system templates
      const defaultTemplates = getDefaultTemplates();
      const systemTemplatesWithIds = defaultTemplates.map((t, index) => ({
        ...t,
        id: `system-${role}-${index}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) as MessageTemplate[];

      // User templates come first, then system templates
      const userTemplates = data || [];
      setTemplates([...userTemplates, ...systemTemplatesWithIds]);
    } catch (err) {
      console.error('Error fetching message templates:', err);
      setError('Failed to load templates');
      
      // Fall back to system templates only
      const defaultTemplates = getDefaultTemplates();
      const systemTemplatesWithIds = defaultTemplates.map((t, index) => ({
        ...t,
        id: `system-${role}-${index}`,
        user_id: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) as MessageTemplate[];
      setTemplates(systemTemplatesWithIds);
    } finally {
      setLoading(false);
    }
  }, [user, role, getDefaultTemplates]);

  // Initial fetch
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Separate custom and system templates
  const customTemplates = templates.filter(t => !t.is_system_template);
  const systemTemplates = templates.filter(t => t.is_system_template);

  // Check if user can add more templates
  const canAddMore = customTemplates.length < MAX_CUSTOM_TEMPLATES;

  // Create a new template
  const createTemplate = async (
    template: Omit<MessageTemplateInsert, 'user_id'>
  ): Promise<MessageTemplate | null> => {
    if (!user) {
      setError('You must be logged in to create templates');
      return null;
    }

    if (!canAddMore) {
      setError(`Maximum of ${MAX_CUSTOM_TEMPLATES} custom templates allowed`);
      return null;
    }

    try {
      const newTemplate: MessageTemplateInsert = {
        ...template,
        user_id: user.id,
        sort_order: customTemplates.length
      };

      const { data, error: insertError } = await supabase
        .from('message_templates')
        .insert(newTemplate)
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state
      setTemplates(prev => [data, ...prev.filter(t => !t.is_system_template), ...prev.filter(t => t.is_system_template)]);
      
      return data;
    } catch (err) {
      console.error('Error creating template:', err);
      setError('Failed to create template');
      return null;
    }
  };

  // Update an existing template
  const updateTemplate = async (
    id: string,
    updates: MessageTemplateUpdate
  ): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to update templates');
      return false;
    }

    // Prevent updating system templates
    const template = templates.find(t => t.id === id);
    if (!template || template.is_system_template) {
      setError('Cannot update system templates');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setTemplates(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updates } : t))
      );

      return true;
    } catch (err) {
      console.error('Error updating template:', err);
      setError('Failed to update template');
      return false;
    }
  };

  // Delete a template
  const deleteTemplate = async (id: string): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to delete templates');
      return false;
    }

    // Prevent deleting system templates
    const template = templates.find(t => t.id === id);
    if (!template || template.is_system_template) {
      setError('Cannot delete system templates');
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      setTemplates(prev => prev.filter(t => t.id !== id));

      return true;
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template');
      return false;
    }
  };

  // Reorder templates
  const reorderTemplates = async (templateIds: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      // Only reorder custom templates
      const updates = templateIds
        .filter(id => !id.startsWith('system-'))
        .map((id, index) => ({
          id,
          sort_order: index
        }));

      for (const update of updates) {
        await supabase
          .from('message_templates')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Error reordering templates:', err);
      setError('Failed to reorder templates');
      return false;
    }
  };

  return {
    templates,
    customTemplates,
    systemTemplates,
    loading,
    error,
    canAddMore,
    customTemplateCount: customTemplates.length,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates,
    refreshTemplates: fetchTemplates
  };
}

export default useMessageTemplates;
