/**
 * Google Maps API Configuration and Utilities
 * Handles dynamic loading and validation of Google Maps API
 */

interface GoogleMapsConfig {
  apiKey: string;
  libraries: string[];
  version?: string;
}

interface GoogleMapsLoadOptions {
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

class GoogleMapsService {
  private static instance: GoogleMapsService;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  /**
   * Validates the Google Maps API key
   */
  validateApiKey(): { isValid: boolean; error?: string } {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return {
        isValid: false,
        error: 'Google Maps API key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.'
      };
    }

    if (apiKey === 'your-google-maps-api-key-here' || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      return {
        isValid: false,
        error: 'Google Maps API key is still using placeholder value. Please update with your actual API key.'
      };
    }

    if (!apiKey.startsWith('AIza')) {
      return {
        isValid: false,
        error: 'Invalid Google Maps API key format. API keys should start with "AIza".'
      };
    }

    return { isValid: true };
  }

  /**
   * Loads Google Maps API dynamically
   */
  async loadGoogleMaps(config?: Partial<GoogleMapsConfig>, options?: GoogleMapsLoadOptions): Promise<void> {
    // Return existing promise if already loading
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Return immediately if already loaded
    if (this.isLoaded && window.google?.maps) {
      options?.onLoad?.();
      return Promise.resolve();
    }

    // Validate API key
    const validation = this.validateApiKey();
    if (!validation.isValid) {
      const error = new Error(validation.error);
      options?.onError?.(error);
      throw error;
    }

    this.isLoading = true;

    const defaultConfig: GoogleMapsConfig = {
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      libraries: ['places', 'geometry'],
      version: 'weekly'
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const libraries = finalConfig.libraries.join(',');
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${finalConfig.apiKey}&libraries=${libraries}&v=${finalConfig.version}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        this.isLoading = false;
        console.log('✅ Google Maps API Loaded Successfully');
        console.log(`📍 API Key: ${finalConfig.apiKey.substring(0, 10)}...`);
        console.log(`📚 Libraries: ${finalConfig.libraries.join(', ')}`);
        options?.onLoad?.();
        resolve();
      };


      script.onerror = (error) => {
        this.isLoading = false;
        const mapError = new Error(`Failed to load Google Maps API: ${error}`);
        options?.onError?.(mapError);
        reject(mapError);
      };

      // Remove existing script if present
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Check if Google Maps is available
   */
  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && !!window.google?.maps;
  }

  /**
   * Get Google Maps configuration
   */
  getConfig(): GoogleMapsConfig {
    return {
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      libraries: ['places', 'geometry'],
      version: 'weekly'
    };
  }
}

// Export singleton instance
export const googleMapsService = GoogleMapsService.getInstance();

// Export types
export type { GoogleMapsConfig, GoogleMapsLoadOptions };

// Utility functions
export const loadGoogleMaps = (config?: Partial<GoogleMapsConfig>, options?: GoogleMapsLoadOptions) => 
  googleMapsService.loadGoogleMaps(config, options);

export const validateGoogleMapsApiKey = () => googleMapsService.validateApiKey();

export const isGoogleMapsLoaded = () => googleMapsService.isGoogleMapsLoaded();