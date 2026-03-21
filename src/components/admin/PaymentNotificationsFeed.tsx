import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import {
  DollarSign,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  X,
  CreditCard,
  Banknote,
} from 'lucide-react';

interface PaymentNotification {
  id: string;
  user_id: string;
  role: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  metadata: {
    job_id?: string;
    amount_cents?: number;
    amount_dollars?: number;
    client_name?: string;
    client_user_id?: string;
    service_name?: string;
    service_address?: string;
    payment_intent_id?: string;
    stripe_session_id?: string;
  };
}

interface PaymentNotificationsFeedProps {
  /** Max notifications to fetch */
  limit?: number;
  /** Callback when a notification is clicked (e.g. navigate to section) */
  onNotificationClick?: (notification: PaymentNotification) => void;
}

export function PaymentNotificationsFeed({
  limit = 20,
  onNotificationClick,
}: PaymentNotificationsFeedProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [flashId, setFlashId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);

  // Fetch payment notifications for this admin user
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'payment_received')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[PaymentNotifications] Fetch error:', error.message);
      return;
    }

    if (mountedRef.current && data) {
      setNotifications(data as PaymentNotification[]);
      setNewCount(data.filter((n: any) => !n.read).length);
    }
  }, [user, limit]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;
    mountedRef.current = true;

    fetchNotifications();

    const channel = supabase
      .channel('admin-payment-notifications-' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as PaymentNotification;
          if (newNotif.type !== 'payment_received') return;

          if (mountedRef.current) {
            setNotifications((prev) => [newNotif, ...prev.slice(0, limit - 1)]);
            setNewCount((prev) => prev + 1);
            setFlashId(newNotif.id);
            // Auto-expand on new notification
            setExpanded(true);

            // Clear flash after animation
            setTimeout(() => {
              if (mountedRef.current) setFlashId(null);
            }, 3000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as PaymentNotification;
          if (updated.type !== 'payment_received') return;

          if (mountedRef.current) {
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
            // Recalculate unread count
            setNotifications((prev) => {
              setNewCount(prev.filter((n) => !n.read).length);
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      channel.unsubscribe();
    };
  }, [user, limit, fetchNotifications]);

  // Mark a single notification as read
  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setNewCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setNewCount(0);
    }
  };

  const handleNotificationClick = (notif: PaymentNotification) => {
    markAsRead(notif.id);
    if (onNotificationClick) {
      onNotificationClick(notif);
    }
  };

  const formatAmount = (notif: PaymentNotification) => {
    const dollars = notif.metadata?.amount_dollars;
    if (dollars && dollars > 0) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(dollars);
    }
    return null;
  };

  // Don't render if no notifications and none expected
  if (notifications.length === 0 && newCount === 0) {
    return null;
  }

  return (
    <div className="mx-3 sm:mx-4 lg:mx-6 mb-4">
      {/* Collapsed header bar */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-xl
          transition-all duration-300 group
          ${
            newCount > 0
              ? 'bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 shadow-[0_0_20px_-8px_rgba(16,185,129,0.3)]'
              : 'bg-gray-900/60 border border-gray-700/40 hover:bg-gray-900/80'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div
            className={`
              relative flex items-center justify-center w-9 h-9 rounded-lg
              ${newCount > 0 ? 'bg-emerald-500/20' : 'bg-gray-800'}
            `}
          >
            <DollarSign
              className={`w-5 h-5 ${
                newCount > 0 ? 'text-emerald-400' : 'text-gray-500'
              }`}
            />
            {newCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-lg animate-pulse">
                {newCount}
              </span>
            )}
          </div>
          <div className="text-left">
            <span
              className={`text-sm font-semibold ${
                newCount > 0 ? 'text-emerald-300' : 'text-gray-400'
              }`}
            >
              Payment Notifications
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {newCount > 0
                ? `${newCount} new`
                : `${notifications.length} total`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="text-xs text-gray-500 hover:text-emerald-400 transition-colors px-2 py-1 rounded-md hover:bg-emerald-500/10"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          )}
        </div>
      </button>

      {/* Expanded notification list */}
      {expanded && (
        <div className="mt-2 rounded-xl border border-gray-700/40 bg-gray-950/80 backdrop-blur overflow-hidden">
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/60">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                <BellOff className="w-4 h-4 mr-2" />
                No payment notifications yet
              </div>
            ) : (
              notifications.map((notif) => {
                const amount = formatAmount(notif);
                const isNew = !notif.read;
                const isFlashing = flashId === notif.id;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`
                      flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-300
                      ${isFlashing ? 'bg-emerald-500/15 animate-pulse' : ''}
                      ${isNew ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-gray-800/50'}
                    `}
                  >
                    {/* Icon */}
                    <div
                      className={`
                        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5
                        ${isNew ? 'bg-emerald-500/20' : 'bg-gray-800'}
                      `}
                    >
                      <CreditCard
                        className={`w-4 h-4 ${
                          isNew ? 'text-emerald-400' : 'text-gray-500'
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            isNew
                              ? 'text-gray-200 font-medium'
                              : 'text-gray-400'
                          }`}
                        >
                          {notif.message}
                        </p>
                        {isNew && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400 mt-1.5" />
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        {amount && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <Banknote className="w-3 h-3" />
                            {amount}
                          </span>
                        )}
                        {notif.metadata?.service_name && (
                          <span className="text-xs text-gray-500 truncate">
                            {notif.metadata.service_name}
                          </span>
                        )}
                        <span className="text-xs text-gray-600">
                          {notif.created_at
                            ? formatDistanceToNow(new Date(notif.created_at), {
                                addSuffix: true,
                              })
                            : ''}
                        </span>
                      </div>
                    </div>

                    {/* Dismiss */}
                    {isNew && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        className="flex-shrink-0 p-1 rounded-md text-gray-600 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
                        title="Mark as read"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800/60 bg-gray-900/40">
              <span className="text-xs text-gray-600">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
              {newCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PaymentNotificationsFeed;
