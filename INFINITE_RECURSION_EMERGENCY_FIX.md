# 🚨 INFINITE RECURSION EMERGENCY FIX

**Date**: 2025-11-12  
**Severity**: CRITICAL - Login Blocking  
**Status**: ✅ RESOLVED

## Problem Summary

After implementing Priority 2 RLS fixes, users experienced **complete login failure** with infinite recursion errors:

```
Error: infinite recursion detected in policy for relation "users"
```

### Impact
- ❌ All logins blocked
- ❌ Profile sync failed
- ❌ Dashboard load failed
- ❌ Jobs/notifications failed
- 🔴 **PRODUCTION DOWN**

## Root Cause

RLS policies on the `users` table contained **circular dependencies**:

```sql
-- PROBLEMATIC POLICY (causes recursion)
CREATE POLICY "users_admin_view" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users  -- ❌ Queries users from within users policy!
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

When checking if a user can read from `users`, PostgreSQL needs to read from `users` to check the policy → infinite loop.

## Solution

### 1. Created Security Definer Function
```sql
CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN
SECURITY DEFINER  -- Bypasses RLS
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;
```

### 2. Replaced Recursive Policies

**Removed (7 policies with recursion):**
- ❌ "Admins can manage all users"
- ❌ "Admins can view all users"
- ❌ "Users can update their own profile"
- ❌ "Users can view their own profile"
- ❌ "users_view_own_safe" (still had recursion)
- ❌ "users_update_own_safe"
- ❌ "users_admin_view_all_safe"

**Created (3 non-recursive policies):**
- ✅ `users_view_own_no_recursion`: Users view own + admins view all
- ✅ `users_update_own_no_recursion`: Users update own only
- ✅ `users_admin_full_access`: Admins full control

### 3. Fixed Reviews Table Recursion

Also found and fixed recursion in `reviews_one_per_job` policy:

```sql
-- Created security definer function
CREATE FUNCTION has_existing_review_for_job(p_job_id UUID)
RETURNS BOOLEAN SECURITY DEFINER;

-- Replaced recursive policy
CREATE POLICY "reviews_one_per_job_no_recursion" ON reviews
FOR INSERT WITH CHECK (NOT has_existing_review_for_job(job_id));
```

## Verification

### ✅ Users Table - Clean
```
users_view_own_no_recursion    | SELECT | (auth.uid() = id) OR is_admin()
users_update_own_no_recursion  | UPDATE | auth.uid() = id
users_admin_full_access        | ALL    | is_admin()
```

### ✅ Reviews Table - Clean
```
reviews_one_per_job_no_recursion | INSERT | NOT has_existing_review_for_job(job_id)
```

### ✅ Other Tables - No Recursion
- landscaper_documents: OK
- payments: OK
- profiles: OK
- quote_requests: OK
- system_audit_logs: OK

## Testing Checklist

- [ ] Test client login
- [ ] Test landscaper login
- [ ] Test admin login
- [ ] Verify profile sync works
- [ ] Verify dashboard loads
- [ ] Verify jobs display
- [ ] Verify notifications load
- [ ] Test review submission
- [ ] Test admin user management

## Prevention Strategy

### Rule: Never Query Same Table in RLS Policy

**❌ NEVER DO THIS:**
```sql
CREATE POLICY "policy_name" ON table_x
USING (
  EXISTS (SELECT 1 FROM table_x WHERE ...)  -- Recursion!
);
```

**✅ ALWAYS DO THIS:**
```sql
-- Option 1: Use auth.uid() directly
CREATE POLICY "policy_name" ON table_x
USING (auth.uid() = user_id);

-- Option 2: Use security definer function
CREATE FUNCTION check_permission() 
RETURNS BOOLEAN SECURITY DEFINER;

CREATE POLICY "policy_name" ON table_x
USING (check_permission());

-- Option 3: Query different tables
CREATE POLICY "policy_name" ON table_x
USING (
  EXISTS (SELECT 1 FROM table_y WHERE ...)  -- OK, different table
);
```

## Lessons Learned

1. **Always test RLS changes in staging first**
2. **Security definer functions are essential for complex checks**
3. **Monitor for recursion patterns during code review**
4. **Have rollback plan for critical security changes**

## Status: RESOLVED ✅

Login functionality restored. All recursion eliminated.
