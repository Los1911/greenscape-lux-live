import React, { useEffect, useState } from 'react';
import { MessageCircle, X, User, Wrench, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageNotification } from '@/hooks/useMessageNotifications';

interface InAppMessageNotificationProps {
  notification: MessageNotification | null;
  onDismiss: () => void;
  onView?: (jobId: string) => void;
}

export function InAppMessageNotification({
  notification,
  onDismiss,
  onView,
}: InAppMessageNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [notification]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  const handleView = () => {
    if (onView && notification) {
      onView(notification.jobId);
    }
    handleDismiss();
  };

  if (!notification || !isVisible) return null;

  const getSenderIcon = () => {
    switch (notification.senderRole) {
      case 'landscaper':
        return <Wrench className="w-4 h-4 text-blue-400" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-400" />;
      default:
        return <User className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getSenderLabel = () => {
    switch (notification.senderRole) {
      case 'landscaper':
        return 'Landscaper';
      case 'admin':
        return 'Admin';
      default:
        return 'Client';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full',
        'transform transition-all duration-300 ease-out',
        isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100'
      )}
    >
      <div className="bg-slate-900 border border-emerald-500/30 rounded-xl shadow-2xl shadow-emerald-500/10 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-medium text-emerald-200">New Message</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Job Title */}
          <div className="text-xs text-slate-400 mb-1">
            {notification.jobTitle}
          </div>

          {/* Sender Info */}
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-slate-800">
              {getSenderIcon()}
            </div>
            <div>
              <span className="text-sm font-medium text-white">
                {getSenderLabel()}
              </span>
              <span className="text-xs text-slate-500 ml-2">
                {formatTime(notification.createdAt)}
              </span>
            </div>
          </div>

          {/* Message Preview */}
          <p className="text-sm text-slate-300 line-clamp-2 mb-3">
            {notification.messagePreview}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleView}
              className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View Message
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        <div className="h-1 bg-slate-800">
          <div 
            className="h-full bg-emerald-500 animate-shrink-width"
            style={{ animationDuration: '5s' }}
          />
        </div>
      </div>
    </div>
  );
}

// Add the animation to your global CSS or tailwind config
// @keyframes shrink-width {
//   from { width: 100%; }
//   to { width: 0%; }
// }

export default InAppMessageNotification;
