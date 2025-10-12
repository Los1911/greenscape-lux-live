import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { JobMessaging } from '@/components/messaging/JobMessaging';

interface JobMessageButtonProps {
  jobId: string;
  jobTitle?: string;
  clientName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function JobMessageButton({ 
  jobId, 
  jobTitle, 
  clientName,
  variant = 'outline', 
  size = 'sm',
  className = ''
}: JobMessageButtonProps) {
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsMessagingOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        {clientName ? `Message ${clientName}` : 'Message Client'}
      </Button>

      <JobMessaging
        jobId={jobId}
        jobTitle={jobTitle}
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
      />
    </>
  );
}