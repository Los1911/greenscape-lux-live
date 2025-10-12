import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, User, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  sender_role: 'client' | 'landscaper';
  message: string;
  created_at: string;
}

interface JobMessagingProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
}

export function JobMessaging({ jobId, isOpen, onClose, jobTitle }: JobMessagingProps) {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && jobId) {
      fetchMessages();
    }
  }, [isOpen, jobId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('job_messages')
        .select('id, job_id, sender_id, sender_role, message, created_at')
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
      const { error } = await supabase
        .from('job_messages')
        .insert({
          job_id: jobId,
          sender_id: user.id,
          sender_role: role,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border border-green-500/25 text-white max-w-2xl h-96">
        <DialogHeader>
          <DialogTitle className="text-green-300 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Job Communication
            {jobTitle && <Badge variant="outline" className="text-xs">{jobTitle}</Badge>}
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
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
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
      </DialogContent>
    </Dialog>
  );
}