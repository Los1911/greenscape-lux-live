import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Lock } from 'lucide-react';
import { StructuredJobMessaging } from '@/components/messaging/StructuredJobMessaging';
import { MessageNotificationBadge } from '@/components/messaging/MessageNotificationBadge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface MessageButtonProps {
  jobId: string;
  jobTitle?: string;
  jobStatus?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  unreadCount?: number;
  onMessagesRead?: () => void;
}

export function MessageButton({ 
  jobId, 
  jobTitle, 
  jobStatus = 'assigned',
  variant = 'outline', 
  size = 'sm',
  className = '',
  unreadCount: externalUnreadCount,
  onMessagesRead,
}: MessageButtonProps) {
  const { user } = useAuth();
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  // Use external count if provided, otherwise use local
  const unreadCount = externalUnreadCount ?? localUnreadCount;

  // Fetch unread count if not provided externally
  useEffect(() => {
    if (externalUnreadCount !== undefined || !user || !jobId) return;

    const fetchUnreadCount = async () => {
      try {
        // Get user's last read time for this job
        const { data: readStatus } = await supabase
          .from('message_read_status')
          .select('last_read_at')
          .eq('user_id', user.id)
          .eq('job_id', jobId)
          .single();

        // Count messages after last read time
        let query = supabase
          .from('job_messages')
          .select('id', { count: 'exact' })
          .eq('job_id', jobId)
          .neq('sender_id', user.id);

        if (readStatus?.last_read_at) {
          query = query.gt('created_at', readStatus.last_read_at);
        }

        const { count } = await query;
        setLocalUnreadCount(count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
  }, [user, jobId, externalUnreadCount]);

  // Mark messages as read when closing messaging
  const handleCloseMessaging = async () => {
    setIsMessagingOpen(false);
    
    // Mark messages as read
    if (user && jobId) {
      try {
        const { data: latestMessage } = await supabase
          .from('job_messages')
          .select('id')
          .eq('job_id', jobId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        await supabase
          .from('message_read_status')
          .upsert({
            user_id: user.id,
            job_id: jobId,
            last_read_at: new Date().toISOString(),
            last_read_message_id: latestMessage?.id || null,
          }, {
            onConflict: 'user_id,job_id'
          });

        setLocalUnreadCount(0);
        onMessagesRead?.();
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  // Check if messaging is available
  const canMessage = jobStatus === 'assigned' || jobStatus === 'active' || jobStatus === 'completed' || jobStatus === 'flagged_review';
  const isActive = jobStatus === 'assigned' || jobStatus === 'active' || jobStatus === 'flagged_review';


  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsMessagingOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <div className="relative">
          <MessageCircle className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2">
              <MessageNotificationBadge count={unreadCount} size="sm" />
            </span>
          )}
        </div>
        {isActive ? 'Message' : 'View Messages'}
        {!isActive && canMessage && <Lock className="w-3 h-3 ml-1 opacity-50" />}
      </Button>

      <StructuredJobMessaging
        jobId={jobId}
        jobStatus={jobStatus}
        jobTitle={jobTitle}
        isOpen={isMessagingOpen}
        onClose={handleCloseMessaging}
      />
    </>
  );
}

export default MessageButton;
