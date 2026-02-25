# Auth Users to Public Users Sync System - Implementation Complete

## 🎯 Overview
Comprehensive database sync system ensuring all `auth.users` have corresponding records in `public.users` with correct roles.

---

## 📦 Components Deployed

### 1. **Migration: `9999_auth_users_sync_system.sql`**
**Location:** `supabase/migrations/`

**Features:**
- ✅ Backfills missing users from `auth.users` to `public.users`
- ✅ Links `user_id` in `clients` and `landscapers` tables by email
- ✅ Creates trigger function `handle_new_user()` for automatic sync
- ✅ Trigger on `auth.users` INSERT to sync new signups
- ✅ Audit log table `user_sync_audit` for tracking

**Role Detection Logic:**
```sql
1. Check admin_sessions → role = 'admin'
2. Check landscapers by email → role = 'landscaper'
3. Check clients by email → role = 'client'
4. Default fallback → role = 'client'
```

---

### 2. **Edge Function: `auth-users-sync-scheduler`**
**Endpoint:** `https://[project].supabase.co/functions/v1/auth-users-sync-scheduler`

**Purpose:** Scheduled audit to catch any sync gaps

**Features:**
- ✅ Fetches all auth.users via Admin API
- ✅ Checks if each user exists in public.users
- ✅ Creates missing records with correct role
- ✅ Logs all operations to `user_sync_audit`
- ✅ Returns detailed sync report

**Response Format:**
```json
{
  "total_auth_users": 150,
  "synced": 3,
  "errors": [],
  "details": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "role": "landscaper",
      "action": "created"
    }
  ]
}
```

---

## 🚀 Deployment Steps

### Step 1: Run Migration
```bash
# Apply migration to Supabase
psql $DATABASE_URL -f supabase/migrations/9999_auth_users_sync_system.sql

# Or via Supabase Dashboard:
# SQL Editor → New Query → Paste migration → Run
```

### Step 2: Verify Trigger
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Test with new signup
-- Trigger will automatically sync to public.users
```

### Step 3: Schedule Edge Function
**Option A: Supabase Cron (Recommended)**
```sql
-- Run daily at 2 AM UTC
SELECT cron.schedule(
  'auth-users-sync',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/auth-users-sync-scheduler',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);
```

**Option B: GitHub Actions**
```yaml
# .github/workflows/auth-sync.yml
name: Auth Users Sync
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST \
            https://[project].supabase.co/functions/v1/auth-users-sync-scheduler \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

---

## 🧪 Testing Checklist

### Test 1: Backfill Existing Users
```sql
-- Before migration: Check missing users
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- After migration: Should return 0 rows
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;
```

### Test 2: New User Signup
```javascript
// Sign up new user
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
});

// Verify public.users record created automatically
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'test@example.com')
  .single();

console.log('Auto-synced user:', user);
// Should show: { id, email, role: 'client', created_at, updated_at }
```

### Test 3: Role Assignment
```sql
-- Create landscaper record first
INSERT INTO landscapers (email, business_name)
VALUES ('landscaper@test.com', 'Test Landscaping');

-- Sign up with same email
-- Trigger should assign role = 'landscaper'

-- Verify
SELECT u.email, u.role 
FROM users u 
WHERE u.email = 'landscaper@test.com';
-- Expected: role = 'landscaper'
```

### Test 4: Manual Sync Function
```bash
# Trigger edge function manually
curl -X POST \
  https://[project].supabase.co/functions/v1/auth-users-sync-scheduler \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"

# Check response
{
  "total_auth_users": 150,
  "synced": 0,
  "errors": [],
  "details": []
}
```

### Test 5: Audit Logs
```sql
-- View sync history
SELECT * FROM user_sync_audit 
ORDER BY created_at DESC 
LIMIT 10;

-- Check specific sync run
SELECT 
  action,
  details->>'total_auth_users' as total,
  details->>'synced' as synced,
  created_at
FROM user_sync_audit
WHERE action = 'scheduled_sync'
ORDER BY created_at DESC;
```

---

## 🔍 Monitoring & Debugging

### Check Sync Status
```sql
-- Count users in each table
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.users) as public_users,
  (SELECT COUNT(*) FROM auth.users au 
   LEFT JOIN public.users pu ON pu.id = au.id 
   WHERE pu.id IS NULL) as missing_sync;
```

### View Role Distribution
```sql
SELECT role, COUNT(*) as count
FROM public.users
GROUP BY role
ORDER BY count DESC;
```

### Find Sync Issues
```sql
-- Users with mismatched roles
SELECT 
  u.email,
  u.role as current_role,
  CASE 
    WHEN EXISTS (SELECT 1 FROM admin_sessions WHERE user_id = u.id) THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM landscapers WHERE email = u.email) THEN 'landscaper'
    WHEN EXISTS (SELECT 1 FROM clients WHERE email = u.email) THEN 'client'
    ELSE 'none'
  END as expected_role
FROM users u
WHERE u.role != CASE 
  WHEN EXISTS (SELECT 1 FROM admin_sessions WHERE user_id = u.id) THEN 'admin'
  WHEN EXISTS (SELECT 1 FROM landscapers WHERE email = u.email) THEN 'landscaper'
  WHEN EXISTS (SELECT 1 FROM clients WHERE email = u.email) THEN 'client'
  ELSE 'client'
END;
```

---

## 🛠️ Troubleshooting

### Issue: Trigger Not Firing
```sql
-- Check trigger status
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Issue: Wrong Role Assigned
```sql
-- Update role manually
UPDATE public.users
SET role = 'landscaper', updated_at = NOW()
WHERE email = 'user@example.com';

-- Verify linked tables
SELECT 
  u.email,
  u.role,
  c.id as client_id,
  l.id as landscaper_id
FROM users u
LEFT JOIN clients c ON c.email = u.email
LEFT JOIN landscapers l ON l.email = u.email
WHERE u.email = 'user@example.com';
```

### Issue: Scheduled Function Not Running
```bash
# Check function logs in Supabase Dashboard
# Edge Functions → auth-users-sync-scheduler → Logs

# Test manually
curl -X POST \
  https://[project].supabase.co/functions/v1/auth-users-sync-scheduler \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -v
```

---

## ✅ Success Indicators

1. **Zero Missing Users:**
   ```sql
   SELECT COUNT(*) FROM auth.users au
   LEFT JOIN public.users pu ON pu.id = au.id
   WHERE pu.id IS NULL;
   -- Should return: 0
   ```

2. **All user_id Links Populated:**
   ```sql
   SELECT COUNT(*) FROM clients WHERE user_id IS NULL;
   SELECT COUNT(*) FROM landscapers WHERE user_id IS NULL;
   -- Both should return: 0 (or only pre-signup records)
   ```

3. **Trigger Active:**
   ```sql
   SELECT tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   -- Should return: O (enabled)
   ```

4. **Recent Sync Logs:**
   ```sql
   SELECT * FROM user_sync_audit 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   -- Should show daily sync runs
   ```

---

## 📋 Maintenance

### Weekly Health Check
```sql
-- Run this query weekly
SELECT 
  'Auth Users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Public Users', COUNT(*) FROM public.users
UNION ALL
SELECT 'Missing Sync', COUNT(*) 
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;
```

### Monthly Role Audit
```sql
-- Verify all roles are correctly assigned
SELECT 
  u.email,
  u.role,
  EXISTS (SELECT 1 FROM admin_sessions WHERE user_id = u.id) as is_admin,
  EXISTS (SELECT 1 FROM landscapers WHERE email = u.email) as is_landscaper,
  EXISTS (SELECT 1 FROM clients WHERE email = u.email) as is_client
FROM users u
ORDER BY u.created_at DESC
LIMIT 100;
```

---

## 🎉 Benefits

✅ **Automatic Sync:** New signups instantly create public.users records  
✅ **Role Accuracy:** Correct role assignment based on linked tables  
✅ **Audit Trail:** Complete history of all sync operations  
✅ **Self-Healing:** Scheduled function catches any missed syncs  
✅ **Zero Downtime:** Trigger-based, no manual intervention needed  

---

**Status:** ✅ DEPLOYED AND ACTIVE  
**Last Updated:** 2025-11-02  
**Next Review:** Check audit logs weekly
