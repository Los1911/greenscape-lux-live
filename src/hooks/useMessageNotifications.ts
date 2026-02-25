import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UnreadCount {
  jobId: string;
  count: number;
  lastMessageAt: string;
  lastSenderRole: 'client' | 'landscaper' | 'admin';
}

export interface MessageNotification {
  id: string;
  jobId: string;
  jobTitle: string;
  senderRole: 'client' | 'landscaper' | 'admin';
  messagePreview: string;
  createdAt: string;
}

export function useMessageNotifications() {
  const { user, role } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<Map<string, UnreadCount>>(new Map());
  const [totalUnread, setTotalUnread] = useState(0);
  const [newNotification, setNewNotification] = useState<MessageNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);

  // Fetch unread counts for all jobs the user is involved in
  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return;

    try {
      // Get all jobs the user is involved in
      let jobsQuery = supabase
        .from('jobs')
        .select('id, service_name, status')
        .in('status', ['assigned', 'active', 'completed', 'flagged_review']);


      if (role === 'client') {
        jobsQuery = jobsQuery.eq('client_id', user.id);
      } else if (role === 'landscaper') {
        jobsQuery = jobsQuery.or(`landscaper_id.eq.${user.id},assigned_to.eq.${user.id}`);
      }

      const { data: jobs, error: jobsError } = await jobsQuery;
      if (jobsError) throw jobsError;

      if (!jobs || jobs.length === 0) {
        setUnreadCounts(new Map());
        setTotalUnread(0);
        setLoading(false);
        return;
      }

      const jobIds = jobs.map(j => j.id);

      // Get user's read status for each job
      const { data: readStatuses, error: readError } = await supabase
        .from('message_read_status')
        .select('job_id, last_read_at')
        .eq('user_id', user.id)
        .in('job_id', jobIds);

      if (readError) throw readError;

      // Create a map of job_id to last_read_at
      const readStatusMap = new Map<string, string>();
      (readStatuses || []).forEach(rs => {
        readStatusMap.set(rs.job_id, rs.last_read_at);
      });

      // Get messages for all jobs
      const { data: messages, error: messagesError } = await supabase
        .from('job_messages')
        .select('id, job_id, sender_id, sender_role, message, created_at')
        .in('job_id', jobIds)
        .neq('sender_id', user.id) // Don't count user's own messages
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Calculate unread counts per job
      const countsMap = new Map<string, UnreadCount>();
      let total = 0;

      (messages || []).forEach(msg => {
        const lastReadAt = readStatusMap.get(msg.job_id);
        const isUnread = !lastReadAt || new Date(msg.created_at) > new Date(lastReadAt);

        if (isUnread) {
          const existing = countsMap.get(msg.job_id);
          if (existing) {
            existing.count += 1;
          } else {
            countsMap.set(msg.job_id, {
              jobId: msg.job_id,
              count: 1,
              lastMessageAt: msg.created_at,
              lastSenderRole: msg.sender_role,
            });
          }
          total += 1;
        }
      });

      setUnreadCounts(countsMap);
      setTotalUnread(total);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  // Mark messages as read for a specific job
  const markAsRead = useCallback(async (jobId: string) => {
    if (!user) return;

    try {
      // Get the latest message ID for this job
      const { data: latestMessage } = await supabase
        .from('job_messages')
        .select('id')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Upsert the read status
      const { error } = await supabase
        .from('message_read_status')
        .upsert({
          user_id: user.id,
          job_id: jobId,
          last_read_at: new Date().toISOString(),
          last_read_message_id: latestMessage?.id || null,
        }, {
          onConflict: 'user_id,job_id'
        });

      if (error) throw error;

      // Update local state
      setUnreadCounts(prev => {
        const next = new Map(prev);
        const existing = next.get(jobId);
        if (existing) {
          setTotalUnread(t => Math.max(0, t - existing.count));
          next.delete(jobId);
        }
        return next;
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  // Get unread count for a specific job
  const getUnreadCount = useCallback((jobId: string): number => {
    return unreadCounts.get(jobId)?.count || 0;
  }, [unreadCounts]);

  // Clear the new notification
  const clearNotification = useCallback(() => {
    setNewNotification(null);
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchUnreadCounts();

    // Subscribe to new messages
    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_messages',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Don't notify for user's own messages
          if (newMessage.sender_id === user.id) return;

          // Check if this job belongs to the user
          const { data: job } = await supabase
            .from('jobs')
            .select('id, service_name, client_id, landscaper_id, assigned_to')
            .eq('id', newMessage.job_id)
            .single();

          if (!job) return;

          // Check if user is involved in this job
          const isInvolved = 
            (role === 'client' && job.client_id === user.id) ||
            (role === 'landscaper' && (job.landscaper_id === user.id || job.assigned_to === user.id)) ||
            role === 'admin';

          if (!isInvolved) return;

          // Update unread counts
          setUnreadCounts(prev => {
            const next = new Map(prev);
            const existing = next.get(newMessage.job_id);
            if (existing) {
              existing.count += 1;
              existing.lastMessageAt = newMessage.created_at;
              existing.lastSenderRole = newMessage.sender_role;
            } else {
              next.set(newMessage.job_id, {
                jobId: newMessage.job_id,
                count: 1,
                lastMessageAt: newMessage.created_at,
                lastSenderRole: newMessage.sender_role,
              });
            }
            return next;
          });
          setTotalUnread(t => t + 1);

          // Show notification
          setNewNotification({
            id: newMessage.id,
            jobId: newMessage.job_id,
            jobTitle: job.service_name || 'Job',
            senderRole: newMessage.sender_role,
            messagePreview: newMessage.message.substring(0, 100) + (newMessage.message.length > 100 ? '...' : ''),
            createdAt: newMessage.created_at,
          });

          // Auto-clear notification after 5 seconds
          setTimeout(() => {
            setNewNotification(prev => prev?.id === newMessage.id ? null : prev);
          }, 5000);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, role, fetchUnreadCounts]);

  return {
    unreadCounts,
    totalUnread,
    newNotification,
    loading,
    getUnreadCount,
    markAsRead,
    clearNotification,
    refreshCounts: fetchUnreadCounts,
  };
}

export default useMessageNotifications;
