import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Leaf, WifiOff, FileWarning } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// =============================================================================
// GLOBAL ERROR BOUNDARY - Prevents white screen crashes
// =============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType: 'chunk' | 'network' | 'render' | 'unknown';
  errorId?: string;
}

// Error type detection
function detectErrorType(error: Error): 'chunk' | 'network' | 'render' | 'unknown' {
  const message = error.message?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';
  
  // Chunk loading failures (lazy loaded components)
  if (
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('loading css chunk') ||
    message.includes('dynamically imported module') ||
    name.includes('chunkloaderror')
  ) {
    return 'chunk';
  }
  
  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    name.includes('typeerror') && message.includes('fetch')
  ) {
    return 'network';
  }
  
  // React rendering errors
  if (
    message.includes('render') ||
    message.includes('component') ||
    message.includes('hook') ||
    message.includes('react')
  ) {
    return 'render';
  }
  
  return 'unknown';
}

// Generate unique error ID for tracking
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Log error to Supabase (non-blocking)
async function logErrorToSupabase(
  error: Error,
  errorInfo: ErrorInfo,
  errorType: string,
  errorId: string
): Promise<void> {
  try {
    // Check if error_logs table exists by attempting insert
    // This is non-blocking and won't crash if table doesn't exist
    const { error: insertError } = await supabase
      .from('error_logs')
      .insert({
        error_id: errorId,
        error_type: errorType,
        error_message: error.message,
        error_stack: error.stack?.substring(0, 5000), // Limit stack trace length
        component_stack: errorInfo.componentStack?.substring(0, 5000),
        url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        timestamp: new Date().toISOString(),
      });
    
    if (insertError) {
      // Table might not exist - that's okay, just log to console
      console.debug('[ErrorBoundary] Could not log to Supabase:', insertError.message);
    } else {
      console.log('[ErrorBoundary] Error logged to Supabase with ID:', errorId);
    }
  } catch (e) {
    // Silent fail - don't let logging errors cause more problems
    console.debug('[ErrorBoundary] Supabase logging failed silently');
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorType = detectErrorType(error);
    const errorId = generateErrorId();
    
    return { 
      hasError: true, 
      error,
      errorType,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = detectErrorType(error);
    const errorId = this.state.errorId || generateErrorId();
    
    // Always log to console
    console.error('🚨 [ErrorBoundary] Caught error:', {
      errorId,
      errorType,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Attempt to log to Supabase (non-blocking)
    logErrorToSupabase(error, errorInfo, errorType, errorId);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorType: 'unknown', errorId: undefined });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoDashboard = () => {
    // Try to detect user role from localStorage and redirect appropriately
    try {
      const authData = localStorage.getItem('greenscape-lux-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        const role = parsed?.user?.user_metadata?.role;
        if (role === 'landscaper') {
          window.location.href = '/landscaper-dashboard';
          return;
        } else if (role === 'admin') {
          window.location.href = '/admin-dashboard';
          return;
        } else if (role === 'client') {
          window.location.href = '/client-dashboard';
          return;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    // Default to home
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorType, errorId } = this.state;
      const isDev = import.meta.env?.DEV;

      // Error-specific messaging
      const errorConfig = {
        chunk: {
          icon: FileWarning,
          title: 'Update Available',
          message: 'A new version of the app is available. Please refresh to get the latest updates.',
          suggestion: 'This usually happens after we deploy improvements.',
        },
        network: {
          icon: WifiOff,
          title: 'Connection Issue',
          message: 'We\'re having trouble connecting to our servers. Please check your internet connection.',
          suggestion: 'Try refreshing the page or checking your network.',
        },
        render: {
          icon: AlertTriangle,
          title: 'Display Error',
          message: 'Something went wrong while displaying this page. Our team has been notified.',
          suggestion: 'Try going back to the dashboard or refreshing.',
        },
        unknown: {
          icon: AlertTriangle,
          title: 'Something Went Wrong',
          message: 'We encountered an unexpected issue. Don\'t worry, your data is safe.',
          suggestion: 'Try refreshing the page or returning to the dashboard.',
        },
      };

      const config = errorConfig[errorType];
      const IconComponent = config.icon;

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl" />
          </div>

          <div className="relative w-full max-w-lg">
            {/* Main error card */}
            <div className="bg-black/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-transparent p-6 border-b border-emerald-500/20">
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Leaf className="w-6 h-6 text-black" />
                    </div>
                    <span className="text-lg font-bold text-white">GreenScape Lux</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Error icon and title */}
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                    <IconComponent className="w-8 h-8 text-amber-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">{config.title}</h1>
                  <p className="text-gray-400 leading-relaxed">{config.message}</p>
                  <p className="text-sm text-gray-500">{config.suggestion}</p>
                </div>

                {/* Error ID for support */}
                {errorId && (
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-xs text-gray-500 text-center">
                      Error Reference: <code className="text-emerald-400 font-mono">{errorId}</code>
                    </p>
                  </div>
                )}

                {/* Dev-only error details */}
                {isDev && error && (
                  <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                      Development Error Details
                    </p>
                    <div className="text-xs font-mono text-red-300/80 overflow-auto max-h-32 whitespace-pre-wrap break-all">
                      {error.message}
                    </div>
                    {error.stack && (
                      <details className="text-xs">
                        <summary className="text-red-400 cursor-pointer hover:text-red-300">
                          Stack trace
                        </summary>
                        <pre className="mt-2 text-red-300/60 overflow-auto max-h-40 text-[10px]">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-3">
                  {/* Primary action - Refresh */}
                  <button
                    onClick={this.handleRefresh}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Refresh Page
                  </button>

                  {/* Secondary actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={this.handleRetry}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white font-medium rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={this.handleGoDashboard}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white font-medium rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
                    >
                      <Home className="w-4 h-4" />
                      Dashboard
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-900/30 border-t border-gray-800/50">
                <p className="text-xs text-gray-500 text-center">
                  If this problem persists, please contact{' '}
                  <a 
                    href="mailto:support@greenscapelux.com" 
                    className="text-emerald-400 hover:text-emerald-300 underline"
                  >
                    support@greenscapelux.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// GLOBAL ERROR HANDLERS - Catch unhandled errors outside React
// =============================================================================

// Initialize global error handlers (call once at app startup)
export function initGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // Prevent duplicate initialization
  if ((window as any).__errorHandlersInitialized) return;
  (window as any).__errorHandlersInitialized = true;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 [Global] Unhandled Promise Rejection:', event.reason);
    
    // Prevent default browser error handling for chunk errors
    if (event.reason?.message?.includes('Loading chunk') ||
        event.reason?.message?.includes('dynamically imported module')) {
      event.preventDefault();
      console.warn('[Global] Chunk loading failed - user may need to refresh');
    }
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('🚨 [Global] Uncaught Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });

    // Don't prevent default - let ErrorBoundary handle React errors
  });

  // Handle chunk loading failures specifically
  window.addEventListener('error', (event) => {
    const target = event.target as HTMLElement;
    if (target?.tagName === 'SCRIPT' || target?.tagName === 'LINK') {
      console.warn('[Global] Resource loading failed:', target);
    }
  }, true);

  console.log('✅ [ErrorBoundary] Global error handlers initialized');
}

// =============================================================================
// CHUNK ERROR RECOVERY - Auto-refresh on chunk failures
// =============================================================================

let chunkErrorCount = 0;
const MAX_CHUNK_RETRIES = 2;

export function handleChunkError(error: Error): boolean {
  const isChunkError = 
    error.message?.includes('Loading chunk') ||
    error.message?.includes('dynamically imported module') ||
    error.message?.includes('Failed to fetch');

  if (isChunkError) {
    chunkErrorCount++;
    console.warn(`[ChunkError] Attempt ${chunkErrorCount}/${MAX_CHUNK_RETRIES}`);

    if (chunkErrorCount <= MAX_CHUNK_RETRIES) {
      // Clear cache and reload
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Force reload after short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true; // Error was handled
    }
  }

  return false; // Error was not handled
}

// Export default for convenience
export default ErrorBoundary;
