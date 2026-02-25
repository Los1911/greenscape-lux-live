import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';
import { 
  MessageCircle, 
  Send, 
  User, 
  Wrench, 
  AlertTriangle,
  Camera,
  Clock,
  CheckCircle,
  HelpCircle,
  Package,
  MapPin,
  FileText,
  ThumbsUp,
  Image as ImageIcon,
  Lock,
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeMessage, MAX_MESSAGE_LENGTH, getBlockedContentWarning } from '@/utils/messageSanitizer';
import { QuickReplySelector } from './QuickReplySelector';
import { TemplateManager } from './TemplateManager';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';

// Structured message types for landscapers
export const LANDSCAPER_MESSAGE_TYPES = [
  { id: 'property_access', label: 'Property Access Question', icon: MapPin, description: 'Ask about gate codes, parking, or access' },
  { id: 'scope_clarification', label: 'Clarify Scope of Work', icon: HelpCircle, description: 'Confirm what needs to be done' },
  { id: 'material_confirmation', label: 'Material Confirmation', icon: Package, description: 'Confirm materials like sod type, mulch color' },
  { id: 'arrival_update', label: 'Arrival Update', icon: Clock, description: 'Let client know you\'re on the way' },
  { id: 'delay_notification', label: 'Delay Notification', icon: AlertTriangle, description: 'Notify about schedule changes' },
  { id: 'completion_note', label: 'Completion Note', icon: CheckCircle, description: 'Share notes about completed work' },
] as const;

// Structured message types for clients
export const CLIENT_MESSAGE_TYPES = [
  { id: 'answer_question', label: 'Answer Question', icon: MessageCircle, description: 'Respond to landscaper\'s question' },
  { id: 'approve_clarification', label: 'Approve Clarification', icon: ThumbsUp, description: 'Confirm scope or materials' },
  { id: 'upload_reference', label: 'Upload Reference Photo', icon: Camera, description: 'Share a photo for reference' },
  { id: 'acknowledge_delay', label: 'Acknowledge Delay', icon: Clock, description: 'Confirm you received delay notice' },
] as const;

type LandscaperMessageType = typeof LANDSCAPER_MESSAGE_TYPES[number]['id'];
type ClientMessageType = typeof CLIENT_MESSAGE_TYPES[number]['id'];
type MessageType = LandscaperMessageType | ClientMessageType;

interface StructuredMessage {
  id: string;
  job_id: string;
  sender_id: string;
  sender_role: 'client' | 'landscaper';
  message_type: MessageType;
  message: string;
  photo_url?: string | null;
  created_at: string;
  is_blocked?: boolean;
}

interface StructuredJobMessagingProps {
  jobId: string;
  jobStatus: string;
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
}

export function StructuredJobMessaging({ 
  jobId, 
  jobStatus, 
  isOpen, 
  onClose, 
  jobTitle 
}: StructuredJobMessagingProps) {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<StructuredMessage[]>([]);
  const [selectedType, setSelectedType] = useState<MessageType | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<any>(null);

  // Message templates hook
  const {
    templates,
    customTemplates,
    systemTemplates,
    canAddMore,
    customTemplateCount,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } = useMessageTemplates();

  // Check if messaging is enabled based on job status
  // Now includes 'flagged_review' status for remediation communication
  const isMessagingEnabled = jobStatus === 'assigned' || jobStatus === 'active' || jobStatus === 'flagged_review';

  const isReadOnly = jobStatus === 'completed';
  // Note: isRemediation could be used for special UI treatment in flagged_review status
  const _isRemediation = jobStatus === 'flagged_review';

  // Get message types based on user role
  const messageTypes = role === 'landscaper' ? LANDSCAPER_MESSAGE_TYPES : CLIENT_MESSAGE_TYPES;

  useEffect(() => {
    if (isOpen && jobId) {
      fetchMessages();
      markMessagesAsRead();
      setupRealtimeSubscription();
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [isOpen, jobId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set up real-time subscription for new messages
  const setupRealtimeSubscription = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`job-messages-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const newMessage = payload.new as StructuredMessage;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          // Mark as read if from someone else
          if (newMessage.sender_id !== user?.id) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  // Mark messages as read when opening the dialog
  const markMessagesAsRead = async () => {
    if (!user || !jobId) return;

    try {
      const { data: latestMessage } = await supabase
        .from('job_messages')
        .select('id')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      await supabase
        .from('message_read_status')
        .upsert({
          user_id: user.id,
          job_id: jobId,
          last_read_at: new Date().toISOString(),
          last_read_message_id: latestMessage?.id || null,
        }, {
          onConflict: 'user_id,job_id'
        });
    } catch (error) {
      // Silently handle - not critical
      console.debug('Error marking messages as read:', error);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    if (text.length > MAX_MESSAGE_LENGTH) {
      text = text.substring(0, MAX_MESSAGE_LENGTH);
    }
    
    const result = sanitizeMessage(text);
    setMessageText(result.sanitizedText);
    
    if (result.containsBlockedContent) {
      setWarning(getBlockedContentWarning(result.blockedTypes));
    } else {
      setWarning(null);
    }
  };

  // Handle quick reply template selection
  const handleTemplateSelect = (content: string, messageType?: string | null) => {
    // Insert template content into the message text
    setMessageText(content);
    
    // If template has a message type and none is selected, auto-select it
    if (messageType && !selectedType) {
      const validType = messageTypes.find(t => t.id === messageType);
      if (validType) {
        setSelectedType(validType.id as MessageType);
      }
    }
    
    // Run sanitization on the template content
    const result = sanitizeMessage(content);
    if (result.containsBlockedContent) {
      setWarning(getBlockedContentWarning(result.blockedTypes));
    } else {
      setWarning(null);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!selectedType || !messageText.trim() || !user) return;
    if (!isMessagingEnabled) return;

    setSending(true);
    try {
      let photoUrl: string | null = null;

      // Upload photo if present
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${jobId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(fileName, photoFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('job-photos')
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      // Final sanitization before sending
      const sanitized = sanitizeMessage(messageText);

      const { error } = await supabase
        .from('job_messages')
        .insert({
          job_id: jobId,
          sender_id: user.id,
          sender_role: role,
          message_type: selectedType,
          message: sanitized.sanitizedText,
          photo_url: photoUrl,
          is_blocked: sanitized.containsBlockedContent,
        });

      if (error) throw error;

      // Reset form
      setMessageText('');
      setSelectedType(null);
      setWarning(null);
      removePhoto();
      
      // Fetch messages to ensure we have the latest
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getMessageTypeInfo = (typeId: MessageType) => {
    const allTypes = [...LANDSCAPER_MESSAGE_TYPES, ...CLIENT_MESSAGE_TYPES];
    return allTypes.find(t => t.id === typeId);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Render the message composer footer
  const renderFooter = () => {
    if (!isMessagingEnabled) return null;

    return (
      <div className="space-y-3">
        {/* Warning Banner */}
        {warning && (
          <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-amber-200 text-sm">{warning}</span>
          </div>
        )}

        {/* Quick Reply Templates */}
        {templates.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <QuickReplySelector
              templates={templates}
              onSelect={handleTemplateSelect}
              onManageTemplates={() => setShowTemplateManager(true)}
              disabled={sending}
              selectedMessageType={selectedType}
            />
          </div>
        )}

        {/* Message Type Selection - Compact grid */}
        {!selectedType && (
          <div className="space-y-2">
            <label className="text-xs text-emerald-200/70 font-medium">Select Message Type</label>
            <div className="grid grid-cols-2 gap-2">
              {messageTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className="flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 border"
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Input - Show when type is selected */}
        {selectedType && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs border-emerald-500/30 text-emerald-200"
                >
                  {getMessageTypeInfo(selectedType)?.label}
                </Badge>
                <button
                  onClick={() => setSelectedType(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Change
                </button>
              </div>
              <span className={`text-xs ${messageText.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-amber-400' : 'text-slate-500'}`}>
                {messageText.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            
            <Textarea
              value={messageText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={getMessageTypeInfo(selectedType)?.description || "Type your message..."}
              className="bg-slate-900/50 border-emerald-500/25 text-white placeholder:text-slate-500 min-h-[60px] max-h-[100px] resize-none text-sm"
              disabled={sending}
            />

            {/* Photo Upload (for reference photos) */}
            {(selectedType === 'upload_reference' || selectedType === 'completion_note') && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/30 text-xs h-8"
                  >
                    <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                    Attach Photo
                  </Button>
                )}
              </div>
            )}

            {/* Send Button */}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedType(null);
                  setMessageText('');
                  setWarning(null);
                  removePhoto();
                }}
                className="text-slate-400 hover:text-slate-200 text-xs h-8"
              >
                Cancel
              </Button>
              <Button 
                onClick={sendMessage} 
                disabled={sending || !messageText.trim()}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
              >
                {sending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <MobileBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Job Communication"
        subtitle={jobTitle}
        icon={<MessageCircle className="w-5 h-5" />}
        height="full"
        footer={renderFooter()}
        contentClassName="space-y-3"
      >
        {/* Platform Safety Notice */}
        <div className="flex items-center gap-2 text-xs text-emerald-200/60 pb-2 border-b border-emerald-500/10">
          <Shield className="w-3 h-3 flex-shrink-0" />
          <span>All messages are logged and visible to admin for your safety</span>
        </div>

        {/* Status Banner */}
        {!isMessagingEnabled && !isReadOnly && (
          <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-amber-200 text-sm">
              Messaging is only available for assigned or in-progress jobs.
            </span>
          </div>
        )}
        
        {isReadOnly && (
          <div className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-300 text-sm">
              This job is completed. Messages are read-only.
            </span>
          </div>
        )}

        {/* Messages List - Scrollable */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-emerald-200/60 py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-emerald-200/60 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No messages yet</p>
              {isMessagingEnabled && (
                <p className="text-sm mt-1">Select a message type below to start</p>
              )}
            </div>
          ) : (
            messages.map((msg) => {
              const typeInfo = getMessageTypeInfo(msg.message_type);
              const TypeIcon = typeInfo?.icon || MessageCircle;
              const isOwnMessage = msg.sender_id === user?.id;
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-lg p-3 ${
                    isOwnMessage
                      ? 'bg-emerald-600/80 text-white' 
                      : 'bg-slate-800 text-slate-100'
                  }`}>
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className={`p-1 rounded ${isOwnMessage ? 'bg-emerald-500/30' : 'bg-slate-700'}`}>
                        {msg.sender_role === 'landscaper' ? (
                          <Wrench className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                      </div>
                      <span className="text-xs opacity-75 capitalize font-medium">
                        {msg.sender_role}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 ${
                          isOwnMessage 
                            ? 'border-emerald-400/40 text-emerald-100' 
                            : 'border-slate-600 text-slate-300'
                        }`}
                      >
                        <TypeIcon className="w-2.5 h-2.5 mr-1" />
                        {typeInfo?.label || msg.message_type}
                      </Badge>
                    </div>
                    
                    {/* Message Content */}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    
                    {/* Photo if present */}
                    {msg.photo_url && (
                      <div className="mt-2">
                        <img 
                          src={msg.photo_url} 
                          alt="Attached photo" 
                          className="rounded-lg max-w-full max-h-48 object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className={`text-[10px] mt-2 ${isOwnMessage ? 'text-emerald-200/60' : 'text-slate-400'}`}>
                      {formatTime(msg.created_at)}
                    </div>
                    
                    {/* Blocked content indicator */}
                    {msg.is_blocked && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-300/70">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Some content was filtered</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </MobileBottomSheet>

      {/* Template Manager Modal */}
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        templates={templates}
        customTemplates={customTemplates}
        systemTemplates={systemTemplates}
        canAddMore={canAddMore}
        customTemplateCount={customTemplateCount}
        onCreateTemplate={createTemplate}
        onUpdateTemplate={updateTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </>
  );
}

export default StructuredJobMessaging;
