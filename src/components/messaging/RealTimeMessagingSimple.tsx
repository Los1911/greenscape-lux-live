import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, User, Wrench, Paperclip, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeMessaging } from '@/hooks/useRealTimeMessaging';

interface RealTimeMessagingSimpleProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
}

export function RealTimeMessagingSimple({ jobId, isOpen, onClose, jobTitle }: RealTimeMessagingSimpleProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    messages,
    typingUsers,
    isConnected,
    unreadCount,
    sendMessage,
    sendFile,
    sendTypingIndicator,
    markAsRead
  } = useRealTimeMessaging(jobId);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 2000);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await sendFile(file);
      event.target.value = '';
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const otherUserTyping = typingUsers.some(t => t.userId !== user?.id && t.isTyping);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border border-green-500/25 text-white max-w-2xl h-[500px]">
        <DialogHeader>
          <DialogTitle className="text-green-300 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Real-Time Chat
            {jobTitle && <Badge variant="outline" className="text-xs">{jobTitle}</Badge>}
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>
            )}
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
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
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
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="bg-black/40 border-green-500/25 text-white"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim()}
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