import React, { createContext, useContext, ReactNode } from 'react';
import { useMessageNotifications, UnreadCount, MessageNotification } from '@/hooks/useMessageNotifications';
import { InAppMessageNotification } from './InAppMessageNotification';

interface MessagingNotificationContextType {
  unreadCounts: Map<string, UnreadCount>;
  totalUnread: number;
  newNotification: MessageNotification | null;
  loading: boolean;
  getUnreadCount: (jobId: string) => number;
  markAsRead: (jobId: string) => Promise<void>;
  clearNotification: () => void;
  refreshCounts: () => Promise<void>;
}

const MessagingNotificationContext = createContext<MessagingNotificationContextType | null>(null);

export function useMessagingNotifications() {
  const context = useContext(MessagingNotificationContext);
  if (!context) {
    throw new Error('useMessagingNotifications must be used within a MessagingNotificationProvider');
  }
  return context;
}

interface MessagingNotificationProviderProps {
  children: ReactNode;
  onViewMessage?: (jobId: string) => void;
}

export function MessagingNotificationProvider({ 
  children, 
  onViewMessage 
}: MessagingNotificationProviderProps) {
  const notifications = useMessageNotifications();

  const handleViewMessage = (jobId: string) => {
    notifications.clearNotification();
    onViewMessage?.(jobId);
  };

  return (
    <MessagingNotificationContext.Provider value={notifications}>
      {children}
      
      {/* Global in-app notification */}
      <InAppMessageNotification
        notification={notifications.newNotification}
        onDismiss={notifications.clearNotification}
        onView={handleViewMessage}
      />
    </MessagingNotificationContext.Provider>
  );
}

export default MessagingNotificationProvider;
