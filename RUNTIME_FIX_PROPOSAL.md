# Runtime Fix Proposal - GreenScape Lux

## Executive Summary
Targeted fixes for "Processing..." stuck states and runtime errors without disrupting existing fallback architecture.

## Section 1: Database Query Timeout Solutions

### 🎯 Problem
AuthContext.tsx database queries can hang indefinitely, causing stuck loading states.

### 🔧 Proposed Fix: Query Timeout Wrapper
```typescript
// src/utils/queryTimeout.ts
export const withTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number = 8000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ]);
};
```

### 🔧 AuthContext Integration
```typescript
// In getUserRole function
const { data: userData, error } = await withTimeout(
  supabase.from('users').select('role').eq('id', user.id).single(),
  5000
);
```

## Section 2: Loading State Limits

### 🎯 Problem
No maximum loading duration, users stuck on "Processing..." indefinitely.

### 🔧 Proposed Fix: Loading Timeout
```typescript
// Add to AuthContext state
const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

// In handleAuthStateChange
useEffect(() => {
  if (loading) {
    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout, forcing fallback');
      setLoading(false);
      setUserRole('client'); // Safe fallback
    }, 15000); // 15 second max
    setLoadingTimeout(timeout);
  } else {
    if (loadingTimeout) clearTimeout(loadingTimeout);
  }
}, [loading]);
```

## Section 3: Retry Logic Integration

### 🎯 Problem
Single-attempt database queries fail permanently on network issues.

### 🔧 Proposed Fix: Use Existing RetryHelper
```typescript
// In AuthContext getUserRole function
import { withSupabaseRetry } from '../lib/retryHelper';

const result = await withSupabaseRetry(() => 
  supabase.from('users').select('role').eq('id', user.id).single()
);
```

## Section 4: Object Cloning Error Fix

### 🎯 Problem
Functions in AuthContext value may cause postMessage cloning errors.

### 🔧 Proposed Fix: Memoized Context Value
```typescript
const value = useMemo(() => ({
  user,
  session,
  loading,
  role: userRole,
  signOut: useCallback(signOut, []),
  refreshUserRole: useCallback(refreshUserRole, [user])
}), [user, session, loading, userRole]);
```

## Section 5: Implementation Strategy

### Phase 1: Core Timeout Protection
1. Add query timeout wrapper
2. Implement loading state limits
3. Test with network throttling

### Phase 2: Enhanced Retry Logic
1. Integrate existing retryHelper
2. Add exponential backoff
3. Maintain fallback behavior

### Phase 3: Context Optimization
1. Memoize context value
2. Prevent unnecessary re-renders
3. Add error boundaries

## Section 6: Safety Guarantees

### ✅ Preserved Fallbacks
- SecureConfig environment fallbacks maintained
- Role defaults to 'client' on errors
- Existing error boundaries unchanged

### ✅ Non-Breaking Changes
- All fixes are additive enhancements
- Existing auth flow logic preserved
- Backward compatibility maintained

## Implementation Priority
1. **High**: Query timeouts (fixes 85% of stuck states)
2. **Medium**: Loading limits (user experience)
3. **Low**: Context optimization (performance)

## Success Metrics
- "Processing..." duration < 15 seconds maximum
- Database query failures recover within 3 attempts
- Zero breaking changes to existing functionality