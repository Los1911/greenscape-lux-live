import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, DollarSign, AlertTriangle, Clock, Briefcase, CreditCard, CheckCircle, XCircle, Zap, ExternalLink, ArrowRight, FileText, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/NotificationService';
import { toast } from 'sonner';
import { notificationSound } from '@/utils/notificationSound';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<'client' | 'landscaper' | null>(null);

  // Fetch user role
  const fetchUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setUserRole(data.role as 'client' | 'landscaper');
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Main data fetch effect
  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchNotifications();
      const cleanup = subscribeToNotifications();
      return cleanup;
    }
  }, [user]);

  // Don't render if no user - AFTER ALL HOOKS
  if (!user) {
    return null;
  }


  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
    setLoading(false);
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        showToastNotification(newNotification);

      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const updated = payload.new as Notification;
        setNotifications(prev => 
          prev.map(n => n.id === updated.id ? updated : n)
        );
        if (updated.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await NotificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  const showToastNotification = (notification: Notification) => {
    const { type, title, message } = notification;
    
    // Play sound alert
    if (type.includes('success') || type.includes('completed') || type.includes('accepted')) {
      notificationSound.playNotificationSound('success');
      toast.success(title, {
        description: message,
        duration: 5000,
      });
    } else if (type.includes('failed') || type.includes('error')) {
      notificationSound.playNotificationSound('error');
      toast.error(title, {
        description: message,
        duration: 6000,
      });
    } else if (type.includes('warning') || type.includes('required')) {
      notificationSound.playNotificationSound('warning');
      toast.warning(title, {
        description: message,
        duration: 5000,
      });
    } else {
      notificationSound.playNotificationSound('info');
      toast.info(title, {
        description: message,
        duration: 4000,
      });
    }
  };



  const handleNotificationAction = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on type and user role
    const { type, data } = notification;

    // Client-specific navigation
    if (userRole === 'client') {
      if (type === 'job_accepted') {
        if (data?.job_id) {
          navigate(`/client-dashboard/jobs?job_id=${data.job_id}`);
        } else {
          navigate('/client-dashboard/jobs');
        }
      } else if (type === 'quote_response' || type === 'quote_received') {
        if (data?.quote_id) {
          navigate(`/client-dashboard/jobs?quote_id=${data.quote_id}`);
        } else {
          navigate('/client-dashboard/jobs');
        }
      } else if (type === 'job_status_update' || type === 'job_scheduled' || type === 'job_in_progress') {
        if (data?.job_id) {
          navigate(`/client-dashboard/jobs?job_id=${data.job_id}`);
        } else {
          navigate('/client-dashboard/jobs');
        }
      } else if (type === 'payment_confirmation' || type === 'payment_success') {
        if (data?.payment_id) {
          navigate(`/client-dashboard/payments?payment_id=${data.payment_id}`);
        } else {
          navigate('/client-dashboard/payments');
        }
      } else if (type === 'service_reminder' || type === 'appointment_reminder') {
        navigate('/client-dashboard/jobs');
      } else if (type === 'payment_method_required') {
        navigate('/client-dashboard/payments');
      } else {
        navigate('/client-dashboard/overview');
      }
    } 
    // Landscaper-specific navigation
    else if (userRole === 'landscaper') {
      if (type === 'new_job_available') {
        navigate('/landscaper/jobs');
      } else if (type === 'job_assigned' || type === 'job_completed') {
        if (data?.job_id) {
          navigate(`/landscaper/jobs?id=${data.job_id}`);
        } else {
          navigate('/landscaper/jobs');
        }
      } else if (type === 'payment_received' || type === 'payout_success' || type === 'payout_processing') {
        navigate('/landscaper/earnings');
      } else if (type.startsWith('stripe_connect')) {
        navigate('/landscaper/profile');
      } else if (type === 'payment_failed' || type === 'payout_failed') {
        navigate('/landscaper/earnings');
      } else {
        navigate('/landscaper-dashboard');
      }
    }

    setIsOpen(false);
  };

  const getActionButton = (notification: Notification) => {
    const { type } = notification;

    // Client-specific buttons
    if (userRole === 'client') {
      if (type === 'quote_response' || type === 'quote_received') {
        return { label: 'View Quote', icon: <FileText className="h-3 w-3" /> };
      } else if (type === 'job_status_update' || type === 'job_scheduled' || type === 'job_in_progress' || type === 'job_accepted') {
        return { label: 'Track Job', icon: <Briefcase className="h-3 w-3" /> };
      } else if (type === 'payment_confirmation' || type === 'payment_success') {
        return { label: 'View Payment', icon: <CreditCard className="h-3 w-3" /> };
      } else if (type === 'service_reminder' || type === 'appointment_reminder') {
        return { label: 'View Schedule', icon: <Calendar className="h-3 w-3" /> };
      } else if (type === 'payment_method_required') {
        return { label: 'Manage Payments', icon: <DollarSign className="h-3 w-3" /> };
      }
    }

    // Landscaper-specific buttons
    if (type === 'job_assigned' || type === 'job_completed' || type === 'new_job_available') {
      return { label: 'View Job', icon: <Briefcase className="h-3 w-3" /> };
    } else if (type === 'payment_received' || type === 'payout_success') {
      return { label: 'View Payment', icon: <DollarSign className="h-3 w-3" /> };
    } else if (type.startsWith('stripe_connect')) {
      return { label: 'Go to Settings', icon: <ExternalLink className="h-3 w-3" /> };
    } else if (type === 'payment_failed' || type === 'payout_failed') {
      return { label: 'View Details', icon: <AlertTriangle className="h-3 w-3" /> };
    } else if (type === 'payout_processing') {
      return { label: 'Track Payout', icon: <Clock className="h-3 w-3" /> };
    }

    return { label: 'View', icon: <ArrowRight className="h-3 w-3" /> };
  };



  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    
    // Client-specific icons
    if (type === 'quote_response' || type === 'quote_received') {
      return <FileText className={`${iconClass} text-blue-600`} />;
    } else if (type === 'job_status_update' || type === 'job_scheduled') {
      return <Briefcase className={`${iconClass} text-blue-600`} />;
    } else if (type === 'job_in_progress') {
      return <Clock className={`${iconClass} text-yellow-600`} />;
    } else if (type === 'payment_confirmation' || type === 'payment_success') {
      return <CheckCircle className={`${iconClass} text-green-600`} />;
    } else if (type === 'service_reminder' || type === 'appointment_reminder') {
      return <Calendar className={`${iconClass} text-purple-600`} />;
    } else if (type === 'payment_method_required') {
      return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
    }

    // Landscaper-specific icons
    switch (type) {
      case 'stripe_connect_active':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'stripe_connect_restricted':
        return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
      case 'stripe_connect_pending':
        return <Clock className={`${iconClass} text-blue-600`} />;
      case 'stripe_charges_enabled':
        return <Zap className={`${iconClass} text-green-600`} />;
      case 'stripe_payouts_enabled':
        return <DollarSign className={`${iconClass} text-green-600`} />;
      case 'payout_success':
        return <DollarSign className={`${iconClass} text-green-600`} />;
      case 'payout_failed':
        return <XCircle className={`${iconClass} text-red-600`} />;
      case 'payout_processing':
        return <Clock className={`${iconClass} text-blue-600`} />;
      case 'job_assigned':
        return <Briefcase className={`${iconClass} text-blue-600`} />;
      case 'job_completed':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'payment_received':
        return <CreditCard className={`${iconClass} text-green-600`} />;
      case 'payment_failed':
        return <XCircle className={`${iconClass} text-red-600`} />;
      default:
        return <Bell className={`${iconClass} text-gray-600`} />;
    }
  };


  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs bg-red-600 hover:bg-red-600"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="notification-dropdown absolute right-0 top-12 w-80 sm:w-96 max-w-[calc(100vw-2rem)] max-h-[32rem] overflow-hidden z-50 shadow-xl border-2">
          <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-emerald-50 to-green-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs hover:bg-white"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-2">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {notification.message}
                      </p>
                      {notification.data?.amount && (
                        <p className="text-sm text-green-700 font-semibold mt-1">
                          ${notification.data.amount.toFixed(2)}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(notification.created_at)}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNotificationAction(notification)}
                          className="h-7 text-xs gap-1 hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-700"
                        >
                          {getActionButton(notification).icon}
                          {getActionButton(notification).label}
                        </Button>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
