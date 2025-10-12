import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, User, Wrench, Paperclip, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeMessaging } from '@/hooks/useRealTimeMessaging';
import { FileUpload } from '@/components/FileUpload';

interface RealTimeMessagingProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
}
  onClose: () => void;
  jobTitle?: string;
}

export function RealTimeMessaging({ jobId, isOpen, onClose, jobTitle }: RealTimeMessagingProps) {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen && jobId && user) {
      fetchMessages();
      connectWebSocket();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isOpen, jobId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    if (!user || !role) return;

    webSocketManager.connect(user.id, role);
    setIsConnected(webSocketManager.isConnected());

    const unsubscribeMessage = webSocketManager.subscribe('message', handleWebSocketMessage);
    const unsubscribeTyping = webSocketManager.subscribe('typing', handleTypingIndicator);
    const unsubscribeFile = webSocketManager.subscribe('file', handleFileMessage);

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeFile();
    };
  };

  const handleWebSocketMessage = (wsMessage: WebSocketMessage) => {
    if (wsMessage.jobId === jobId && wsMessage.userId !== user?.id) {
      const newMsg: Message = {
        id: wsMessage.data.id || Date.now().toString(),
        job_id: jobId,
        sender_id: wsMessage.userId,
        sender_role: wsMessage.userRole,
        message: wsMessage.data.message,
        created_at: new Date(wsMessage.timestamp).toISOString()
      };
      setMessages(prev => [...prev, newMsg]);
    }
  };

  const handleTypingIndicator = (wsMessage: WebSocketMessage) => {
    if (wsMessage.jobId === jobId && wsMessage.userId !== user?.id) {
      setOtherUserTyping(wsMessage.data.isTyping);
    }
  };

  const handleFileMessage = (wsMessage: WebSocketMessage) => {
    if (wsMessage.jobId === jobId && wsMessage.userId !== user?.id) {
      const newMsg: Message = {
        id: wsMessage.data.id || Date.now().toString(),
        job_id: jobId,
        sender_id: wsMessage.userId,
        sender_role: wsMessage.userRole,
        message: wsMessage.data.message || 'Sent a file',
        file_url: wsMessage.data.file_url,
        file_name: wsMessage.data.file_name,
        created_at: new Date(wsMessage.timestamp).toISOString()
      };
      setMessages(prev => [...prev, newMsg]);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('id, job_id, sender_id, sender_role, message, file_url, file_name, created_at')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const messageData = {
        job_id: jobId,
        sender_id: user.id,
        sender_role: role,
        message: newMessage.trim(),
        created_at: new Date().toISOString()
      };

      // Send via WebSocket for real-time delivery
      webSocketManager.sendMessage({
        type: 'message',
        jobId,
        userId: user.id,
        userRole: role as 'client' | 'landscaper',
        data: messageData,
        timestamp: Date.now()
      });

      // Also save to database
      const { error } = await supabase
        .from('communications')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      setMessages(prev => [...prev, { ...messageData, id: Date.now().toString() }]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      webSocketManager.sendMessage({
        type: 'typing',
        jobId,
        userId: user!.id,
        userRole: role as 'client' | 'landscaper',
        data: { isTyping: true },
        timestamp: Date.now()
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      webSocketManager.sendMessage({
        type: 'typing',
        jobId,
        userId: user!.id,
        userRole: role as 'client' | 'landscaper',
        data: { isTyping: false },
        timestamp: Date.now()
      });
    }, 2000);
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('job-photos')
        .upload(`messages/${jobId}/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(data.path);

      const messageData = {
        job_id: jobId,
        sender_id: user.id,
        sender_role: role,
        message: `Sent a file: ${file.name}`,
        file_url: publicUrl,
        file_name: file.name,
        created_at: new Date().toISOString()
      };

      // Send file message via WebSocket
      webSocketManager.sendMessage({
        type: 'file',
        jobId,
        userId: user.id,
        userRole: role as 'client' | 'landscaper',
        data: messageData,
        timestamp: Date.now()
      });

      // Save to database
      await supabase.from('communications').insert(messageData);
      
      setMessages(prev => [...prev, { ...messageData, id: Date.now().toString() }]);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border border-green-500/25 text-white max-w-2xl h-[500px]">
        <DialogHeader>
          <DialogTitle className="text-green-300 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Real-Time Chat
            {jobTitle && <Badge variant="outline" className="text-xs">{jobTitle}</Badge>}
            <div className="ml-auto flex items-center gap-1">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-lg ${
                  msg.sender_id === user?.id
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.sender_role === 'landscaper' ? (
                      <Wrench className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-75 capitalize">
                      {msg.sender_role}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                  {msg.file_url && (
                    <a 
                      href={msg.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-300 underline text-xs block mt-1"
                    >
                      📎 {msg.file_name}
                    </a>
                  )}
                </div>
              </div>
            ))}
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-100 p-2 rounded-lg text-sm italic">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFileUpload(true)}
              className="border-green-500/25 hover:bg-green-500/10"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
              className="bg-black/40 border-green-500/25 text-white"
              disabled={loading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={loading || !newMessage.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showFileUpload && (
          <FileUpload
            onUpload={handleFileUpload}
            onClose={() => setShowFileUpload(false)}
            accept="image/*,.pdf,.doc,.docx"
            maxSize={10 * 1024 * 1024} // 10MB
          />
        )}
      </DialogContent>
    </Dialog>
  );
}