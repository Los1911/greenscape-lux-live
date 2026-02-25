import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CloudRain, CheckCircle, XCircle } from 'lucide-react';

interface RemediationTimerProps {
  deadline: string;
  weatherExtensionHours?: number;
  status?: string;
  onExpired?: () => void;
}

export default function RemediationTimer({ 
  deadline, 
  weatherExtensionHours = 0,
  status,
  onExpired 
}: RemediationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    totalHours: number;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false, totalHours: 0 });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      
      // Add weather extension if applicable
      if (weatherExtensionHours > 0) {
        deadlineDate.setHours(deadlineDate.getHours() + weatherExtensionHours);
      }
      
      const diff = deadlineDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, isExpired: true, totalHours: 0 });
        onExpired?.();
        return;
      }
      
      const totalHours = diff / (1000 * 60 * 60);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ hours, minutes, seconds, isExpired: false, totalHours });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [deadline, weatherExtensionHours, onExpired]);

  // Determine urgency level
  const getUrgencyStyles = () => {
    if (timeRemaining.isExpired) {
      return {
        bg: 'bg-red-900/40',
        border: 'border-red-500/50',
        text: 'text-red-300',
        icon: 'text-red-400',
        pulse: ''
      };
    }
    
    if (timeRemaining.totalHours <= 6) {
      return {
        bg: 'bg-red-900/30',
        border: 'border-red-500/40',
        text: 'text-red-300',
        icon: 'text-red-400',
        pulse: 'animate-pulse'
      };
    }
    
    if (timeRemaining.totalHours <= 24) {
      return {
        bg: 'bg-amber-900/30',
        border: 'border-amber-500/40',
        text: 'text-amber-300',
        icon: 'text-amber-400',
        pulse: ''
      };
    }
    
    return {
      bg: 'bg-emerald-900/30',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300',
      icon: 'text-emerald-400',
      pulse: ''
    };
  };

  const styles = getUrgencyStyles();

  // If status indicates completion, show different UI
  if (status === 'completed' || status === 'resolved_partial') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-900/30 border border-emerald-500/40">
        <CheckCircle className="h-5 w-5 text-emerald-400" />
        <span className="text-emerald-300 font-medium">Remediation Completed</span>
      </div>
    );
  }

  if (status === 'escalated' || status === 'resolved_refund') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-600">
        <XCircle className="h-5 w-5 text-slate-400" />
        <span className="text-slate-300 font-medium">
          {status === 'escalated' ? 'Escalated to Admin' : 'Resolved with Refund'}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${styles.bg} ${styles.border} p-4 ${styles.pulse}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
          <span className={`font-semibold ${styles.text}`}>
            Remediation Required
          </span>
        </div>
        {weatherExtensionHours > 0 && (
          <div className="flex items-center gap-1 text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded-full">
            <CloudRain className="h-3 w-3" />
            <span>+{weatherExtensionHours}h weather</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center gap-1 mb-3">
        <Clock className={`h-6 w-6 ${styles.icon}`} />
        <div className={`text-3xl font-mono font-bold ${styles.text}`}>
          {timeRemaining.isExpired ? (
            <span>EXPIRED</span>
          ) : (
            <>
              <span>{String(timeRemaining.hours).padStart(2, '0')}</span>
              <span className="animate-pulse">:</span>
              <span>{String(timeRemaining.minutes).padStart(2, '0')}</span>
              <span className="animate-pulse">:</span>
              <span>{String(timeRemaining.seconds).padStart(2, '0')}</span>
            </>
          )}
        </div>
      </div>
      
      <p className="text-center text-sm text-slate-400">
        {timeRemaining.isExpired 
          ? 'Time has expired. Admin review required.'
          : 'Time remaining to complete remediation'
        }
      </p>
    </div>
  );
}
