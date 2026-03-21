/**
 * Direct Edge Function Client
 * 
 * Bypasses supabase.functions.invoke() to avoid FunctionsFetchError issues
 * caused by the supabase-js client's internal fetch wrapper when verify_jwt is enabled.
 *
 * Uses native fetch() with explicit headers for full control over the request lifecycle.
 */

import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EdgeFunctionResult<T = any> {
  data: T | null;
  error: string | null;
}

interface JobExecutionPayload {
  action: 'start' | 'complete' | 'admin_approve' | 'admin_reject' | 'reject';
  jobId: string;
  rejectionReason?: string;
  reason?: string;
  [key: string]: unknown;
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the Supabase functions base URL from the configured project URL.
 * e.g. https://xyz.supabase.co  →  https://xyz.supabase.co/functions/v1
 */
function getFunctionsBaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) throw new Error('Missing VITE_SUPABASE_URL');
  return `${url.replace(/\/+$/, '')}/functions/v1`;
}

/**
 * Returns the anon / publishable key used as the `apikey` header.
 */
function getAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY');
  return key;
}

/**
 * Gets a fresh access token, refreshing the session if needed.
 * Returns null if the user is not authenticated.
 */
async function getFreshAccessToken(): Promise<string | null> {
  try {
    // First try getSession (cached, fast)
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('[EdgeFnClient] getSession error:', error.message);
    }

    if (session?.access_token) {
      // Check if token is about to expire (within 60 seconds)
      const expiresAt = session.expires_at; // unix timestamp in seconds
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt && expiresAt - now < 60) {
        console.log('[EdgeFnClient] Token expiring soon, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('[EdgeFnClient] Token refresh failed:', refreshError.message);
          // Fall through to use the existing (almost-expired) token
        } else if (refreshData.session?.access_token) {
          return refreshData.session.access_token;
        }
      }
      return session.access_token;
    }

    // No session from getSession, try refreshing
    console.log('[EdgeFnClient] No session found, attempting refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error('[EdgeFnClient] Session refresh failed:', refreshError.message);
      return null;
    }
    return refreshData.session?.access_token ?? null;
  } catch (err) {
    console.error('[EdgeFnClient] Unexpected error getting token:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core invoke helper
// ---------------------------------------------------------------------------

/**
 * Invokes a Supabase Edge Function using native fetch().
 *
 * Why not supabase.functions.invoke()?
 * – When verify_jwt is true on the function, the Supabase gateway validates
 *   the JWT before forwarding to the function. If the gateway returns an error
 *   (e.g. 401) without CORS headers, the browser treats it as a network error,
 *   and supabase-js wraps it as FunctionsFetchError("Failed to send a request
 *   to the Edge Function") — which hides the real cause.
 * – Using fetch() directly lets us handle every response status explicitly.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<EdgeFunctionResult<T>> {
  const tag = `[EdgeFnClient:${functionName}]`;

  // 1. Get auth token
  const accessToken = await getFreshAccessToken();
  if (!accessToken) {
    console.error(tag, 'No access token available — user not authenticated');
    return { data: null, error: 'User not authenticated. Please log in and try again.' };
  }

  // 2. Build request
  const url = `${getFunctionsBaseUrl()}/${functionName}`;
  const anonKey = getAnonKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
    'Authorization': `Bearer ${accessToken}`,
  };

  console.log(tag, 'Invoking →', { url, action: body.action, jobId: body.jobId });

  // 3. Execute fetch
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (networkError: any) {
    // True network failure (offline, DNS, CORS preflight blocked, etc.)
    console.error(tag, 'Network/CORS error — fetch() threw:', networkError);
    return {
      data: null,
      error: `Network error calling ${functionName}. This may be a CORS or connectivity issue. Details: ${networkError.message || 'Unknown'}`,
    };
  }

  // 4. Parse response
  let responseBody: any;
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      const text = await response.text();
      console.warn(tag, `Non-JSON response (${response.status}):`, text.slice(0, 500));
      // Try to parse as JSON anyway (some edge functions don't set content-type)
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = { success: false, error: text || `HTTP ${response.status}` };
      }
    }
  } catch (parseError: any) {
    console.error(tag, 'Failed to parse response body:', parseError);
    responseBody = { success: false, error: `Failed to parse response (HTTP ${response.status})` };
  }

  // 5. Handle HTTP-level errors (gateway rejections, 4xx, 5xx)
  if (!response.ok) {
    const errorMessage = responseBody?.error
      || responseBody?.message
      || responseBody?.msg
      || `Edge function returned HTTP ${response.status}`;
    console.error(tag, `HTTP ${response.status} error:`, responseBody);
    return { data: null, error: errorMessage };
  }

  // 6. Handle application-level errors (function returned { success: false })
  if (responseBody && responseBody.success === false) {
    const errorMessage = responseBody.error || 'Edge function returned failure';
    console.error(tag, 'Application error:', responseBody);
    return { data: null, error: errorMessage };
  }

  // 7. Success
  console.log(tag, 'Success:', responseBody);
  return { data: responseBody as T, error: null };
}

// ---------------------------------------------------------------------------
// Typed wrapper for job-execution
// ---------------------------------------------------------------------------

/**
 * Invokes the `job-execution` edge function with proper auth and error handling.
 *
 * @example
 * const { data, error } = await invokeJobExecution({
 *   action: 'admin_approve',
 *   jobId: '123-456',
 * });
 * if (error) { alert(error); return; }
 * console.log('Approved:', data);
 */
export async function invokeJobExecution(
  payload: JobExecutionPayload,
): Promise<EdgeFunctionResult> {
  return invokeEdgeFunction('job-execution', payload);
}
