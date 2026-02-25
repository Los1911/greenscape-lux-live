// TODO: Re-enable WebSocket functionality after production deployment
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, User, Wrench, Paperclip, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FileUpload } from '@/components/FileUpload';

interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
}

interface RealTimeMessagingProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
}

export function RealTimeMessaging({ jobId, isOpen, onClose, jobTitle }: RealTimeMessagingProps) {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // TODO: WebSocket disabled - using Supabase realtime as fallback
  const isConnected = false;

  useEffect(() => {
    if (isOpen && jobId && user) {
      fetchMessages();
      // TODO: Re-enable WebSocket connection after production
      // connectWebSocket();
    }
  }, [isOpen, jobId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // TODO: Re-enable WebSocket connection after production deployment
  // const connectWebSocket = () => { ... };
  // const handleWebSocketMessage = (wsMessage) => { ... };
  // const handleTypingIndicator = (wsMessage) => { ... };
  // const handleFileMessage = (wsMessage) => { ... };

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
      console.error('[MESSAGING] Error fetching messages:', error);
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
      // TODO: Re-enable WebSocket for real-time delivery after production
      // webSocketManager.sendMessage({ type: 'message', ... });
      const { error } = await supabase.from('communications').insert(messageData);
      if (error) throw error;
      setNewMessage('');
      setMessages(prev => [...prev, { ...messageData, id: Date.now().toString() }]);
    } catch (error) {
      console.error('[MESSAGING] Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('job-photos')
        .upload(`messages/${jobId}/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('job-photos').getPublicUrl(data.path);
      const messageData = {
        job_id: jobId, sender_id: user.id, sender_role: role,
        message: `Sent a file: ${file.name}`, file_url: publicUrl, file_name: file.name,
        created_at: new Date().toISOString()
      };
      // TODO: Re-enable WebSocket file message after production
      await supabase.from('communications').insert(messageData);
      setMessages(prev => [...prev, { ...messageData, id: Date.now().toString() }]);
      setShowFileUpload(false);
    } catch (error) {
      console.error('[MESSAGING] Error uploading file:', error);
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border border-green-500/25 text-white max-w-2xl h-[500px]">
        <DialogHeader>
          <DialogTitle className="text-green-300 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat {jobTitle && <Badge variant="outline" className="text-xs">{jobTitle}</Badge>}
            <div className="ml-auto flex items-center gap-1">
              <WifiOff className="w-4 h-4 text-yellow-400" title="WebSocket disabled" />
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-lg ${msg.sender_id === user?.id ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.sender_role === 'landscaper' ? <Wrench className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    <span className="text-xs opacity-75 capitalize">{msg.sender_role}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                  {msg.file_url && <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline text-xs block mt-1">{msg.file_name}</a>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFileUpload(true)} className="border-green-500/25 hover:bg-green-500/10"><Paperclip className="w-4 h-4" /></Button>
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()} className="bg-black/40 border-green-500/25 text-white" disabled={loading} />
            <Button onClick={sendMessage} disabled={loading || !newMessage.trim()} className="bg-green-600 hover:bg-green-700"><Send className="w-4 h-4" /></Button>
          </div>
        </div>
        {showFileUpload && <FileUpload onUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} accept="image/*,.pdf,.doc,.docx" maxSize={10 * 1024 * 1024} />}
      </DialogContent>
    </Dialog>
  );
}
