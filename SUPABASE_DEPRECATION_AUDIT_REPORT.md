# Supabase Environment Variable & Client Instance Audit Report
**Generated:** 2025-11-12  
**Project:** GreenScape Lux  
**Audit Type:** Deprecated Variables & Redundant Client Instances

---

## Executive Summary

✅ **GOOD NEWS:** No active code uses deprecated `VITE_SUPABASE_ANON_KEY`  
⚠️ **CRITICAL:** Multiple redundant Supabase client instances found  
🔴 **HIGH PRIORITY:** Hardcoded credentials in fallback configurations  

---

## 1. VITE_SUPABASE_ANON_KEY References

### Status: ✅ CLEAN (Documentation Only)

**Search Results:** 100+ matches found  
**Location:** ALL in documentation/markdown files (.md)  
**Active Code:** 0 matches

**Conclusion:** The migration from `VITE_SUPABASE_ANON_KEY` to `VITE_SUPABASE_PUBLISHABLE_KEY` is complete in all active code. References only exist in historical documentation.

**Severity:** LOW  
**Recommended Fix:** Update documentation to reflect current variable names (cosmetic only)

---

## 2. Redundant Supabase Client Instances

### 🔴 CRITICAL: Multiple Client Initializations Found

| File | Severity | Status | Issue |
|------|----------|--------|-------|
| `src/lib/supabase.ts` | ✅ OK | PRIMARY | Correct implementation using VITE_SUPABASE_PUBLISHABLE_KEY |
| `src/lib/supabaseClient.ts` | 🔴 CRITICAL | REDUNDANT | Creates duplicate client with hardcoded fallback |
| `src/lib/database.ts` | 🔴 CRITICAL | DEPRECATED | Uses `APP_ENV.SUPABASE_ANON_KEY` (old variable) |
| `src/lib/supabaseSecure.ts` | ⚠️ HIGH | REDUNDANT | Creates another client instance |
| `src/lib/supabaseServiceRole.ts` | ✅ OK | VALID | Service role client for admin operations |
| `src/utils/rlsAuditSystem.ts` | 🔴 CRITICAL | REDUNDANT | Creates 3 separate client instances |

---

## 3. Detailed Findings

### 🔴 CRITICAL ISSUE #1: src/lib/database.ts
**File:** `src/lib/database.ts` (Lines 1-17)  
**Problem:** Uses deprecated `APP_ENV.SUPABASE_ANON_KEY` variable name

```typescript
// ❌ DEPRECATED CODE
export function createSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  if (!APP_ENV.SUPABASE_URL || !APP_ENV.SUPABASE_ANON_KEY) {
    throw new Error("Supabase config missing");
  }
  _client = createClient(APP_ENV.SUPABASE_URL, APP_ENV.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _client;
}
```

**Severity:** CRITICAL  
**Executes in Production:** YES  
**Recommended Fix:**
```typescript
// ✅ REPLACE WITH
import { supabase } from './supabase';
export { supabase };
// DELETE the createSupabaseClient function
```

---

### 🔴 CRITICAL ISSUE #2: src/lib/supabaseClient.ts
**File:** `src/lib/supabaseClient.ts` (Lines 1-49)  
**Problem:** Creates redundant client with hardcoded production credentials

```typescript
// ❌ HARDCODED CREDENTIALS (Lines 17-20)
const FALLBACK_CONFIG = {
  VITE_SUPABASE_URL: 'https://mwvcbedvnimabfwubazz.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

**Severity:** CRITICAL (Security Risk + Redundancy)  
**Executes in Production:** YES  
**Recommended Fix:** DELETE this file entirely, use `src/lib/supabase.ts`

---

### ⚠️ HIGH ISSUE #3: src/lib/supabaseSecure.ts
**File:** `src/lib/supabaseSecure.ts` (Lines 1-18)  
**Problem:** Creates yet another Supabase client instance

**Severity:** HIGH  
**Executes in Production:** Depends on imports  
**Recommended Fix:** DELETE this file, use `src/lib/supabase.ts`

---

### 🔴 CRITICAL ISSUE #4: src/utils/rlsAuditSystem.ts
**File:** `src/utils/rlsAuditSystem.ts` (Lines 29-46)  
**Problem:** Creates 3 separate Supabase client instances in constructor

```typescript
// ❌ CREATES 3 CLIENTS
constructor() {
  this.anonClient = createClient(config.supabase.url, config.supabase.anonKey);
  this.authClient = createClient(config.supabase.url, config.supabase.anonKey);
  this.serviceClient = createClient(config.supabase.url, config.supabase.anonKey);
}
```

**Severity:** CRITICAL  
**Executes in Production:** Only if RLS audit is triggered  
**Recommended Fix:**
```typescript
import { supabase } from '@/lib/supabase';
import { supabaseServiceRole } from '@/lib/supabaseServiceRole';

constructor() {
  this.anonClient = supabase;
  this.authClient = supabase;
  this.serviceClient = supabaseServiceRole;
}
```

---

## 4. Auth Method Usage Audit

### ✅ All Auth Calls Use Centralized Import

**Search Results:** 7 matches for `signInWithPassword`  
**All instances correctly import from:** `src/lib/supabase.ts`

**Files Using Auth:**
- ✅ `src/components/auth/ConsolidatedAuth.tsx` - imports from `@/lib/supabase`
- ✅ `src/components/auth/UnifiedAuthPage.tsx` - imports from `@/lib/supabase`
- ✅ `src/components/auth/UnifiedPortalAuth.tsx` - imports from `@/lib/supabase`
- ✅ `src/pages/AdminLogin.tsx` - imports from `@/lib/supabase`

**Conclusion:** No auth methods use redundant client instances

---

## 5. Hardcoded Credentials Audit

### 🔴 CRITICAL: Hardcoded Production Credentials Found

**File:** `src/lib/supabaseClient.ts` (Line 19)  
**Credential Type:** Supabase Publishable Key (JWT)  
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY`

**Risk Level:** MEDIUM (Publishable key is safe to expose, but hardcoding is bad practice)  
**Recommended Fix:** Remove hardcoded fallback, rely on environment variables only

---

## 6. Recommended Actions (Priority Order)

### 🔴 CRITICAL (Do Immediately)

1. **DELETE** `src/lib/supabaseClient.ts`
   - Contains hardcoded credentials
   - Creates redundant client
   - Replace all imports with `src/lib/supabase.ts`

2. **DELETE** `src/lib/database.ts`
   - Uses deprecated `SUPABASE_ANON_KEY` variable
   - Creates redundant client
   - Replace all imports with `src/lib/supabase.ts`

3. **FIX** `src/utils/rlsAuditSystem.ts`
   - Import centralized clients instead of creating new ones
   - Reduces memory footprint
   - Ensures consistent configuration

### ⚠️ HIGH (Do This Week)

4. **DELETE** `src/lib/supabaseSecure.ts`
   - Redundant client instance
   - Replace with `src/lib/supabase.ts`

5. **VERIFY** No components import from deleted files
   - Search for `from '@/lib/supabaseClient'`
   - Search for `from '@/lib/database'`
   - Search for `from '@/lib/supabaseSecure'`

### 📝 MEDIUM (Do When Convenient)

6. **UPDATE** Documentation files to use `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Cosmetic only, no functional impact
   - Prevents confusion for new developers

---

## 7. Verification Checklist

After implementing fixes, verify:

- [ ] Only 2 Supabase clients exist:
  - [ ] `src/lib/supabase.ts` (main client)
  - [ ] `src/lib/supabaseServiceRole.ts` (admin client)
- [ ] No hardcoded credentials in any file
- [ ] All components import from centralized clients
- [ ] No references to `SUPABASE_ANON_KEY` (without VITE_ prefix)
- [ ] Application builds without errors
- [ ] Login/auth flows work correctly
- [ ] Admin operations work correctly

---

## 8. Impact Assessment

**Production Build Impact:** HIGH  
**Reason:** Multiple redundant clients increase bundle size and memory usage

**Security Impact:** MEDIUM  
**Reason:** Hardcoded credentials are bad practice (though publishable key is safe to expose)

**Maintainability Impact:** HIGH  
**Reason:** Multiple client instances make debugging and updates difficult

---

## Conclusion

The GreenScape Lux codebase has successfully migrated away from deprecated `VITE_SUPABASE_ANON_KEY` in active code, but suffers from **multiple redundant Supabase client instances** that should be consolidated to a single source of truth (`src/lib/supabase.ts`).

**Priority:** Consolidate all Supabase client usage to eliminate redundancy and improve maintainability.
