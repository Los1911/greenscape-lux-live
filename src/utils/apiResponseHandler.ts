// Utility to handle API responses and fix JSON parsing errors

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export class ApiResponseHandler {
  static async parseResponse<T = any>(response: Response): Promise<ApiResponse<T>> {
    try {
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status
        };
      }

      // Get response text first
      const responseText = await response.text();
      
      // Check if response is empty
      if (!responseText.trim()) {
        return {
          success: true,
          data: null as T
        };
      }

      // Check if response is HTML (common error case)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        return {
          success: false,
          error: 'Server returned HTML instead of JSON. This usually indicates an authentication or routing issue.',
          status: response.status
        };
      }

      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        return {
          success: true,
          data
        };
      } catch (parseError) {
        return {
          success: false,
          error: `Invalid JSON response: ${parseError.message}`,
          status: response.status
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error.message}`,
        status: 0
      };
    }
  }

  static async safeFetch<T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // Add default headers
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      return this.parseResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: `Request failed: ${error.message}`,
        status: 0
      };
    }
  }

  static isJsonResponse(contentType: string | null): boolean {
    return contentType?.includes('application/json') ?? false;
  }

  static async handleSupabaseResponse<T = any>(response: any): Promise<ApiResponse<T>> {
    if (response.error) {
      return {
        success: false,
        error: response.error.message || 'Supabase operation failed',
        status: response.status
      };
    }

    return {
      success: true,
      data: response.data
    };
  }
}

// Hook for React components
export function useApiResponse() {
  const safeFetch = async <T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return ApiResponseHandler.safeFetch<T>(url, options);
  };

  const parseResponse = async <T = any>(response: Response): Promise<ApiResponse<T>> => {
    return ApiResponseHandler.parseResponse<T>(response);
  };

  return {
    safeFetch,
    parseResponse,
    handleSupabaseResponse: ApiResponseHandler.handleSupabaseResponse
  };
}