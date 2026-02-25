import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  ChevronDown,
  MessageSquare,
  Sparkles,
  User,
  Settings
} from 'lucide-react';
import { MessageTemplate } from '@/types/messageTemplate';

interface QuickReplySelectorProps {
  templates: MessageTemplate[];
  onSelect: (content: string, messageType?: string | null) => void;
  onManageTemplates?: () => void;
  disabled?: boolean;
  selectedMessageType?: string | null;
}

export function QuickReplySelector({
  templates,
  onSelect,
  onManageTemplates,
  disabled = false,
  selectedMessageType
}: QuickReplySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter templates by message type if one is selected
  const filteredTemplates = selectedMessageType
    ? templates.filter(t => !t.message_type || t.message_type === selectedMessageType)
    : templates;

  // Separate custom and system templates
  const customTemplates = filteredTemplates.filter(t => !t.is_system_template);
  const systemTemplates = filteredTemplates.filter(t => t.is_system_template);

  const handleSelect = (template: MessageTemplate) => {
    onSelect(template.content, template.message_type);
    setIsOpen(false);
  };

  if (templates.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/30 hover:text-emerald-100 gap-2"
        >
          <Zap className="w-3.5 h-3.5" />
          Quick Reply
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-slate-900 border-emerald-500/25"
        align="start"
      >
        <div className="p-3 border-b border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-100">Quick Replies</span>
            </div>
            {onManageTemplates && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  onManageTemplates();
                }}
                className="h-7 px-2 text-xs text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/30"
              >
                <Settings className="w-3 h-3 mr-1" />
                Manage
              </Button>
            )}
          </div>
          {selectedMessageType && (
            <p className="text-xs text-emerald-200/60 mt-1">
              Showing templates for selected message type
            </p>
          )}
        </div>

        <ScrollArea className="max-h-[300px]">
          {/* Custom Templates Section */}
          {customTemplates.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                <User className="w-3 h-3 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300/80 uppercase tracking-wide">
                  My Templates
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-300">
                  {customTemplates.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {customTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/40 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-emerald-100 truncate">
                          {template.name}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                          {template.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* System Templates Section */}
          {systemTemplates.length > 0 && (
            <div className="p-2 border-t border-emerald-500/10">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-medium text-emerald-300/80 uppercase tracking-wide">
                  Suggested
                </span>
              </div>
              <div className="space-y-1">
                {systemTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/40 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {template.name}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {template.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredTemplates.length === 0 && (
            <div className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No templates available</p>
              {selectedMessageType && (
                <p className="text-xs text-slate-500 mt-1">
                  Try selecting a different message type
                </p>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer hint */}
        <div className="p-2 border-t border-emerald-500/10 bg-slate-900/50">
          <p className="text-[10px] text-slate-500 text-center">
            Click to insert • You can edit before sending
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default QuickReplySelector;
