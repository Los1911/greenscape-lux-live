// src/lib/analytics.ts
// Google Analytics 4 tracking utilities

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}

// ✅ Use GA Tracking ID from environment variable
export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || 'G-XXXXXXXXXX';

// ✅ Validate that GA ID is real and not placeholder
const isValidTrackingId = (id: string): boolean => {
  return id && id !== 'G-XXXXXXXXXX' && id.startsWith('G-');
};

// ✅ Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined') return;

  // Prevent initialization with invalid or placeholder ID
  if (!isValidTrackingId(GA_TRACKING_ID)) {
    console.warn('⚠️ Google Analytics not initialized: Invalid or placeholder tracking ID');
    return;
  }

  // Load the gtag script dynamically
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });

  console.log('✅ Google Analytics initialized with ID:', GA_TRACKING_ID);
};

// ✅ Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window === 'undefined' || !window.gtag || !isValidTrackingId(GA_TRACKING_ID)) return;

  window.gtag('config', GA_TRACKING_ID, {
    page_path: path,
    page_title: title || document.title,
  });
};

// ✅ Track general events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window === 'undefined' || !window.gtag || !isValidTrackingId(GA_TRACKING_ID)) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// ✅ Track Google Ads conversions (optional)
export const trackConversion = (conversionId: string, value?: number) => {
  if (typeof window === 'undefined' || !window.gtag || !isValidTrackingId(GA_TRACKING_ID)) return;

  window.gtag('event', 'conversion', {
    send_to: conversionId,
    value: value,
    currency: 'USD',
  });
};

// ✅ Track Instant Quote form submissions (GreenScape Lux feature)
export const trackQuoteSubmission = (services: string[], value?: number) => {
  if (!isValidTrackingId(GA_TRACKING_ID)) return;

  // Track form submission event
  trackEvent('quote_submitted', 'form', services.join(', '), value);

  // Track conversion if valid conversion ID exists
  const conversionId = import.meta.env.VITE_GA_CONVERSION_ID;
  if (conversionId && conversionId !== 'AW-XXXXXXXXX/XXXXXXXXX') {
    trackConversion(conversionId, value);
  }
};