/**
 * Edge Function Helper
 * 
 * This module provides a helper function for calling Supabase edge functions
 * without the custom x-application-name header that causes CORS issues.
 */

interface EdgeFunctionOptions {
  body?: Record<string, any>;
}

interface EdgeFunctionResponse<T = any> {
  data: T | null;
  error: Error | null;
}

/**
 * Call a Supabase edge function using direct fetch to avoid CORS issues
 * with custom headers like x-application-name
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  options: EdgeFunctionOptions = {},
  accessToken?: string
): Promise<EdgeFunctionResponse<T>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    return {
      data: null,
      error: new Error('Supabase URL not configured')
    };
  }

  const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key
    if (anonKey) {
      headers['apikey'] = anonKey;
    }

    // Add authorization if provided
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[EDGE_FUNCTION] ${functionName} failed:`, response.status, errorText);
      return {
        data: null,
        error: new Error(`Edge function failed: ${response.status} ${errorText}`)
      };
    }

    const data = await response.json();
    return { data, error: null };

  } catch (error: any) {
    console.error(`[EDGE_FUNCTION] ${functionName} error:`, error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Helper to get payment methods without CORS issues
 */
export async function getPaymentMethods(customerId: string, accessToken: string) {
  return invokeEdgeFunction('get-payment-methods', {
    body: { customerId }
  }, accessToken);
}

/**
 * Helper to delete a payment method
 */
export async function deletePaymentMethod(paymentMethodId: string, accessToken: string) {
  return invokeEdgeFunction('delete-payment-method', {
    body: { paymentMethodId }
  }, accessToken);
}

/**
 * Helper to create a Stripe customer
 */
export async function createStripeCustomer(
  userId: string,
  email: string,
  name: string,
  accessToken: string
) {
  return invokeEdgeFunction('create-stripe-customer', {
    body: { userId, email, name }
  }, accessToken);
}

/**
 * Helper to attach a payment method
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string,
  accessToken: string
) {
  return invokeEdgeFunction('attach-payment-method', {
    body: { paymentMethodId, customerId }
  }, accessToken);
}
