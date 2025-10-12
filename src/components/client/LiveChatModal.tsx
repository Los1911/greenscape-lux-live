import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Bot, User, Phone, Mail } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'support';
  message: string;
  timestamp: Date;
}

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveChatModal({ isOpen, onClose }: LiveChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'support',
      message: 'Hello! How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      message: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate support response
    setTimeout(() => {
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        message: 'Thank you for your message. Our team will get back to you shortly.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, supportMessage]);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border border-green-500/25 text-white max-w-md h-96">
        <DialogHeader>
          <DialogTitle className="text-green-300">Live Chat Support</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-lg ${
                  msg.sender === 'user' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.sender === 'support' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-75">
                      {msg.sender === 'support' ? 'Support' : 'You'}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="bg-black/40 border-green-500/25 text-white"
            />
            <Button onClick={sendMessage} className="bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Contact Options */}
          <div className="mt-4 pt-4 border-t border-green-500/20">
            <p className="text-xs text-gray-400 mb-2">Other ways to reach us:</p>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1 text-green-300">
                <Phone className="w-3 h-3" />
                (555) 123-4567
              </div>
              <div className="flex items-center gap-1 text-green-300">
                <Mail className="w-3 h-3" />
                support@greenscape.com
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}