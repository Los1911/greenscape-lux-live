import React, { useState } from 'react';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigateBackContextAware } from '@/utils/navigationHelpers';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can we help you today?',
      sender: 'support',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate support response
    setTimeout(() => {
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thank you for your message. Our team will respond shortly. For immediate assistance, please call (555) 123-4567.',
        sender: 'support',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, supportMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleBack = async () => {
    // Use context-aware navigation to return to appropriate dashboard
    await navigateBackContextAware(navigate, location.pathname);
  };

  return (
    <AppLayout>
      <AnimatedBackground />
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black p-4 lg:p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-green-400 hover:text-green-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_25px_-10px_rgba(34,197,94,0.25)] h-[600px] flex flex-col">
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-green-400" />
                <h1 className="text-2xl font-semibold text-green-300">Live Chat Support</h1>
              </div>
              <p className="text-sm text-gray-400 mt-1">We're here to help with your landscaping needs</p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-700/50">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="bg-black/50 border-green-500/30 text-white flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-green-600 hover:bg-green-500 px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                For immediate assistance, call (555) 123-4567
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
