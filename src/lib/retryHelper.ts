import { PostgrestError } from '@supabase/supabase-js'

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options

  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        throw error
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      )
      
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

function isNonRetryableError(error: any): boolean {
  // Don't retry on authentication errors
  if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
    return true
  }
  
  // Don't retry on permission errors
  if (error?.code === 'PGRST116' || error?.message?.includes('permission')) {
    return true
  }
  
  // Don't retry on validation errors
  if (error?.code === 'PGRST204' || error?.message?.includes('violates')) {
    return true
  }
  
  return false
}

export async function withSupabaseRetry<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<{ data: T | null; error: PostgrestError | null }> {
  return withRetry(async () => {
    const result = await operation()
    
    // If there's an error, throw it so the retry logic can handle it
    if (result.error) {
      throw result.error
    }
    
    return result
  })
}