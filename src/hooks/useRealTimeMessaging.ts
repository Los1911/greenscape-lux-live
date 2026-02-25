// TODO: Re-enable WebSocket functionality after production deployment
// WebSocket imports disabled - using Supabase realtime as fallback
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
// import { webSocketManager, WebSocketMessage } from '@/services/WebSocketManager';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  sender_role: 'client' | 'landscaper';
  message: string;
  file_url?: string;
  file_name?: string;
  message_type: 'text' | 'file' | 'system';
  read_at?: string;
  created_at: string;
}

interface TypingStatus {
  userId: string;
  userRole: 'client' | 'landscaper';
  isTyping: boolean;
}

export function useRealTimeMessaging(jobId: string) {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  // TODO: WebSocket disabled - always false until re-enabled
  const [isConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // TODO: Re-enable WebSocket connection after production deployment
  // WebSocket initialization disabled - using Supabase realtime only
  useEffect(() => {
    if (user && role && jobId) {
      console.log('[MESSAGING] WebSocket disabled - using Supabase realtime only');
      // Set up Supabase real-time subscription as primary method
      const channel = supabase
        .channel(`job-messages-${jobId}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'communications', filter: `job_id=eq.${jobId}` },
          handleDatabaseMessage
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [user, role, jobId]);

  useEffect(() => {
    if (jobId) {
      loadMessages();
      loadUnreadCount();
    }
  }, [jobId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('[MESSAGING] Error loading messages:', error);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('id')
        .eq('job_id', jobId)
        .neq('sender_id', user.id)
        .is('read_at', null);
      if (error) throw error;
      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('[MESSAGING] Error loading unread count:', error);
    }
  };

  const handleDatabaseMessage = useCallback((payload: any) => {
    const newMessage = payload.new as Message;
    if (newMessage.sender_id !== user?.id) {
      setMessages(prev => {
        const exists = prev.find(m => m.id === newMessage.id);
        return exists ? prev : [...prev, newMessage];
      });
      setUnreadCount(prev => prev + 1);
    }
  }, [user?.id]);

  const sendMessage = async (message: string): Promise<boolean> => {
    if (!user || !role || !message.trim()) return false;
    try {
      const messageData = {
        job_id: jobId,
        sender_id: user.id,
        sender_role: role,
        message: message.trim(),
        message_type: 'text' as const,
        created_at: new Date().toISOString()
      };
      // TODO: Re-enable WebSocket for immediate delivery after production
      // webSocketManager.sendMessage({ type: 'message', ... });
      const { error } = await supabase
        .from('communications')
        .insert(messageData);
      if (error) throw error;
      // Use optimistic UI update with local data instead of returned row
      setMessages(prev => [...prev, { ...messageData, id: `temp-${Date.now()}` } as Message]);
      return true;
    } catch (error) {
      console.error('[MESSAGING] Error sending message:', error);
      // Queue for offline sending
      const offlineMessages = JSON.parse(localStorage.getItem('offline_messages') || '[]');
      offlineMessages.push({ type: 'message', jobId, userId: user.id, userRole: role, data: { message }, timestamp: Date.now() });
      localStorage.setItem('offline_messages', JSON.stringify(offlineMessages));
      return false;
    }
  };


  const sendFile = async (file: File): Promise<boolean> => {
    if (!user || !role) return false;
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(`messages/${jobId}/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('job-photos').getPublicUrl(uploadData.path);
      const messageData = {
        job_id: jobId, sender_id: user.id, sender_role: role,
        message: `Sent a file: ${file.name}`, file_url: publicUrl, file_name: file.name,
        message_type: 'file' as const, created_at: new Date().toISOString()
      };
      // TODO: Re-enable WebSocket file message after production
      const { error } = await supabase.from('communications').insert(messageData);
      if (error) throw error;
      // Use optimistic UI update with local data instead of returned row
      setMessages(prev => [...prev, { ...messageData, id: `temp-${Date.now()}` } as Message]);
      return true;
    } catch (error) {
      console.error('[MESSAGING] Error sending file:', error);
      return false;
    }
  };


  const sendTypingIndicator = (isTyping: boolean) => {
    // TODO: Re-enable WebSocket typing indicator after production
    console.log('[MESSAGING] Typing indicator disabled (WebSocket off):', isTyping);
  };

  const markAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from('communications')
        .update({ read_at: new Date().toISOString() })
        .eq('job_id', jobId)
        .neq('sender_id', user.id)
        .is('read_at', null);
      setUnreadCount(0);
    } catch (error) {
      console.error('[MESSAGING] Error marking messages as read:', error);
    }
  };

  return { messages, typingUsers, isConnected, unreadCount, sendMessage, sendFile, sendTypingIndicator, markAsRead, refreshMessages: loadMessages };
}
