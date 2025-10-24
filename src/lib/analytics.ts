// Google Analytics 4 tracking utilities
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}

<<<<<<< HEAD
export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || 'G-XXXXXXXXXX';

// Check if GA tracking ID is valid (not placeholder)
const isValidTrackingId = (id: string): boolean => {
  return id && id !== 'G-XXXXXXXXXX' && id.startsWith('G-');
};
=======
export const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // Replace with actual GA4 ID
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined') return;
<<<<<<< HEAD
  
  // Don't initialize GA with placeholder ID
  if (!isValidTrackingId(GA_TRACKING_ID)) {
    console.warn('⚠️ Google Analytics not initialized: Invalid or placeholder tracking ID');
    return;
  }
=======
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
<<<<<<< HEAD
  
  console.log('✅ Google Analytics initialized with ID:', GA_TRACKING_ID);
=======
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
<<<<<<< HEAD
  if (typeof window === 'undefined' || !window.gtag || !isValidTrackingId(GA_TRACKING_ID)) return;
=======
  if (typeof window === 'undefined' || !window.gtag) return;
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
  
  window.gtag('config', GA_TRACKING_ID, {
    page_path: path,
    page_title: title || document.title,
  });
};

// Track events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
<<<<<<< HEAD
  if (typeof window === 'undefined' || !window.gtag || !isValidTrackingId(GA_TRACKING_ID)) return;
=======
  if (typeof window === 'undefined' || !window.gtag) return;
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track conversions
export const trackConversion = (conversionId: string, value?: number) => {
<<<<<<< HEAD
  if (typeof window === 'undefined' || !window.gtag || !isValidTrackingId(GA_TRACKING_ID)) return;
=======
  if (typeof window === 'undefined' || !window.gtag) return;
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
  
  window.gtag('event', 'conversion', {
    send_to: conversionId,
    value: value,
    currency: 'USD',
  });
};

// Track quote form submissions
export const trackQuoteSubmission = (services: string[], value?: number) => {
<<<<<<< HEAD
  if (!isValidTrackingId(GA_TRACKING_ID)) return;
  
  trackEvent('quote_submitted', 'form', services.join(', '), value);
  // Only track conversion if conversion ID is valid
  const conversionId = import.meta.env.VITE_GA_CONVERSION_ID;
  if (conversionId && conversionId !== 'AW-XXXXXXXXX/XXXXXXXXX') {
    trackConversion(conversionId, value);
  }
};
=======
  trackEvent('quote_submitted', 'form', services.join(', '), value);
  trackConversion('AW-XXXXXXXXX/XXXXXXXXX', value); // Replace with actual conversion ID
};
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
