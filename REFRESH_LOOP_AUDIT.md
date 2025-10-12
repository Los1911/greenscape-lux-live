# Page Refresh Loop Audit Report

## Issue Summary
User reports page loops on refresh (desktop only) - mobile works fine.

## Root Cause Analysis

### 1. **Multiple Auth State Listeners** (CRITICAL)
Found **4 active `onAuthStateChange` listeners** creating race conditions:

- `AuthContext.tsx` (line 57) - ✅ PROPER - Single global listener
- `ProtectedRoute.tsx` (line 65) - ❌ REDUNDANT - calls `checkAuth()` on every change
- `ClientRequestsCard.tsx` (line 53) - ❌ REDUNDANT - reloads data on auth change
- `ResetPassword.tsx` (line 50) - ❌ CONTEXT-SPECIFIC - only for password recovery

### 2. **Desktop vs Mobile Behavior**
Mobile works because:
- Different browser caching behavior
- Mobile browsers handle auth state differently
- Less aggressive localStorage/sessionStorage clearing

Desktop fails because:
- Multiple listeners fire simultaneously on refresh
- Race condition between initial session check and state change events
- Each listener triggers navigation/redirects

### 3. **Specific Problem Flow**
1. Page refreshes → `getInitialSession()` runs
2. Multiple `onAuthStateChange` listeners fire
3. `ProtectedRoute.tsx` calls `checkAuth()` → potential redirect
4. `AuthContext.tsx` updates state → triggers more listeners
5. Components re-render → more auth checks
6. **INFINITE LOOP**

## Immediate Fix Required

### Remove Redundant Listeners
1. **ProtectedRoute.tsx** - Remove `onAuthStateChange`, use AuthContext instead
2. **ClientRequestsCard.tsx** - Use AuthContext state, remove listener
3. Keep only AuthContext as single source of truth

### Quick Desktop Fix
Clear browser data for the site (cookies, localStorage, sessionStorage)

## Files to Modify
- `src/components/shared/ProtectedRoute.tsx` - Remove auth listener
- `src/components/client/ClientRequestsCard.tsx` - Use AuthContext
- Ensure all components use `useAuth()` hook instead of direct listeners