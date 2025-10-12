import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { webSocketManager, WebSocketMessage } from '@/services/WebSocketManager';
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
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user && role) {
      webSocketManager.connect(user.id, role);
      setIsConnected(webSocketManager.isConnected());

      // Subscribe to WebSocket events
      const unsubscribeMessage = webSocketManager.subscribe('message', handleIncomingMessage);
      const unsubscribeTyping = webSocketManager.subscribe('typing', handleTypingUpdate);
      const unsubscribeFile = webSocketManager.subscribe('file', handleFileMessage);

      // Set up Supabase real-time subscription as fallback
      const channel = supabase
        .channel(`job-messages-${jobId}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'communications', filter: `job_id=eq.${jobId}` },
          handleDatabaseMessage
        )
        .subscribe();

      return () => {
        unsubscribeMessage();
        unsubscribeTyping();
        unsubscribeFile();
        channel.unsubscribe();
      };
    }
  }, [user, role, jobId]);

  // Load initial messages
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
      console.error('Error loading messages:', error);
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
      console.error('Error loading unread count:', error);
    }
  };

  const handleIncomingMessage = useCallback((wsMessage: WebSocketMessage) => {
    if (wsMessage.jobId === jobId && wsMessage.userId !== user?.id) {
      const newMessage: Message = {
        id: wsMessage.data.id || `temp-${Date.now()}`,
        job_id: jobId,
        sender_id: wsMessage.userId,
        sender_role: wsMessage.userRole,
        message: wsMessage.data.message,
        message_type: 'text',
        created_at: new Date(wsMessage.timestamp).toISOString()
      };
      
      setMessages(prev => {
        const exists = prev.find(m => m.id === newMessage.id);
        return exists ? prev : [...prev, newMessage];
      });
      
      setUnreadCount(prev => prev + 1);
    }
  }, [jobId, user?.id]);

  const handleFileMessage = useCallback((wsMessage: WebSocketMessage) => {
    if (wsMessage.jobId === jobId && wsMessage.userId !== user?.id) {
      const newMessage: Message = {
        id: wsMessage.data.id || `temp-${Date.now()}`,
        job_id: jobId,
        sender_id: wsMessage.userId,
        sender_role: wsMessage.userRole,
        message: wsMessage.data.message || 'Sent a file',
        file_url: wsMessage.data.file_url,
        file_name: wsMessage.data.file_name,
        message_type: 'file',
        created_at: new Date(wsMessage.timestamp).toISOString()
      };
      
      setMessages(prev => {
        const exists = prev.find(m => m.id === newMessage.id);
        return exists ? prev : [...prev, newMessage];
      });
      
      setUnreadCount(prev => prev + 1);
    }
  }, [jobId, user?.id]);

  const handleTypingUpdate = useCallback((wsMessage: WebSocketMessage) => {
    if (wsMessage.jobId === jobId && wsMessage.userId !== user?.id) {
      setTypingUsers(prev => {
        const filtered = prev.filter(t => t.userId !== wsMessage.userId);
        if (wsMessage.data.isTyping) {
          return [...filtered, {
            userId: wsMessage.userId,
            userRole: wsMessage.userRole,
            isTyping: true
          }];
        }
        return filtered;
      });
    }
  }, [jobId, user?.id]);

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

      // Send via WebSocket first for immediate delivery
      webSocketManager.sendMessage({
        type: 'message',
        jobId,
        userId: user.id,
        userRole: role as 'client' | 'landscaper',
        data: messageData,
        timestamp: Date.now()
      });

      // Save to database
      const { data, error } = await supabase
        .from('communications')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Update local state with database ID
      setMessages(prev => [...prev, data]);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Queue for offline sending if WebSocket failed
      if (!webSocketManager.isConnected()) {
        const offlineMessages = JSON.parse(localStorage.getItem('offline_messages') || '[]');
        offlineMessages.push({
          type: 'message',
          jobId,
          userId: user.id,
          userRole: role,
          data: { message },
          timestamp: Date.now()
        });
        localStorage.setItem('offline_messages', JSON.stringify(offlineMessages));
      }
      
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

      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(uploadData.path);

      const messageData = {
        job_id: jobId,
        sender_id: user.id,
        sender_role: role,
        message: `Sent a file: ${file.name}`,
        file_url: publicUrl,
        file_name: file.name,
        message_type: 'file' as const,
        created_at: new Date().toISOString()
      };

      // Send via WebSocket
      webSocketManager.sendMessage({
        type: 'file',
        jobId,
        userId: user.id,
        userRole: role as 'client' | 'landscaper',
        data: messageData,
        timestamp: Date.now()
      });

      // Save to database
      const { data, error } = await supabase
        .from('communications')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      return true;
    } catch (error) {
      console.error('Error sending file:', error);
      return false;
    }
  };

  const sendTypingIndicator = (isTyping: boolean) => {
    if (!user || !role) return;

    webSocketManager.sendMessage({
      type: 'typing',
      jobId,
      userId: user.id,
      userRole: role as 'client' | 'landscaper',
      data: { isTyping },
      timestamp: Date.now()
    });

    // Also update database for persistence
    supabase.rpc('update_typing_status', {
      p_job_id: jobId,
      p_user_id: user.id,
      p_user_role: role,
      p_is_typing: isTyping
    });
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
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    messages,
    typingUsers,
    isConnected,
    unreadCount,
    sendMessage,
    sendFile,
    sendTypingIndicator,
    markAsRead,
    refreshMessages: loadMessages
  };
}