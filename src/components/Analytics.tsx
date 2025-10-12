import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

interface AnalyticsProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Track page views on route changes
    trackPageView(location.pathname + location.search);
  }, [location]);

  return <>{children}</>;
};

// Hook for tracking events in components
export const useAnalytics = () => {
  return {
    trackEvent: (action: string, category: string, label?: string, value?: number) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value,
        });
      }
    },
    trackConversion: (conversionId: string, value?: number) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: conversionId,
          value: value,
          currency: 'USD',
        });
      }
    }
  };
};