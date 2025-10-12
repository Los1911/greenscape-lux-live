import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { RealTimeMessagingSimple } from '@/components/messaging/RealTimeMessagingSimple';

interface MessageButtonProps {
  jobId: string;
  jobTitle?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function MessageButton({ jobId, jobTitle, variant = 'outline', size = 'sm' }: MessageButtonProps) {
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsMessagingOpen(true)}
        className="flex items-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        Message
      </Button>

      <RealTimeMessagingSimple
        jobId={jobId}
        jobTitle={jobTitle}
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
      />
    </>
  );
}