import { toast } from '@/hooks/use-toast';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}

export class ErrorHandler {
  static handle(error: unknown, context?: string): void {
    const appError = this.normalize(error);
    
    // Log error for debugging
    console.error(`[${context || 'Unknown'}]`, {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      context: appError.context,
      stack: appError.stack
    });

    // Show user-friendly message
    this.showUserMessage(appError, context);
    
    // Report to monitoring service (if configured)
    this.reportError(appError, context);
  }

  private static normalize(error: unknown): AppError {
    if (error instanceof Error) {
      return error as AppError;
    }
    
    if (typeof error === 'string') {
      return new Error(error) as AppError;
    }
    
    return new Error('An unknown error occurred') as AppError;
  }

  private static showUserMessage(error: AppError, context?: string): void {
    const userMessage = this.getUserMessage(error, context);
    
    toast({
      title: 'Error',
      description: userMessage,
      variant: 'destructive'
    });
  }

  private static getUserMessage(error: AppError, context?: string): string {
    // Network errors
    if (error.message.includes('fetch') || error.statusCode === 0) {
      return 'Network connection issue. Please check your internet connection.';
    }
    
    // Authentication errors
    if (error.statusCode === 401 || error.code === 'UNAUTHORIZED') {
      return 'Please log in to continue.';
    }
    
    // Permission errors
    if (error.statusCode === 403 || error.code === 'FORBIDDEN') {
      return 'You do not have permission to perform this action.';
    }
    
    // Not found errors
    if (error.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    
    // Server errors
    if (error.statusCode && error.statusCode >= 500) {
      return 'Server error. Please try again later.';
    }
    
    // Context-specific messages
    if (context === 'payment') {
      return 'Payment processing failed. Please try again.';
    }
    
    if (context === 'upload') {
      return 'File upload failed. Please try again.';
    }
    
    // Default message
    return error.message || 'Something went wrong. Please try again.';
  }

  private static reportError(error: AppError, context?: string): void {
    // In production, send to monitoring service like Sentry
    if (import.meta.env?.PROD) {
      // Sentry.captureException(error, { tags: { context } });
    }
  }
}

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorHandler.handle(error, context);
      return null;
    }
  };
};