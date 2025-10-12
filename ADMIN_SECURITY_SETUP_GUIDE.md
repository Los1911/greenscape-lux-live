# Admin Security System Setup Guide

## Overview
This guide walks through setting up the secure admin authentication system for GreenScape Lux.

## Features Implemented
✅ Dedicated admin login page with security warnings
✅ Admin role verification in database
✅ Login attempt logging and monitoring
✅ Session tracking for admin users
✅ Super admin privilege levels
✅ Protected admin routes with enhanced security
✅ Audit trail for admin actions

## Setup Instructions

### 1. Run Database Migration
Execute the admin security migration in Supabase SQL Editor:
```bash
# The migration file is located at:
supabase/migrations/9999_admin_security_system.sql
```

This creates:
- `admin_login_logs` table - tracks all admin login attempts
- `admin_sessions` table - manages active admin sessions
- `is_admin()` function - verifies admin role
- RLS policies for security
- Indexes for performance

### 2. Create Admin User

#### Option A: Using Supabase Dashboard
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Fill in:
   - Email: `admin@greenscapelux.com`
   - Password: [Your secure password]
   - Auto Confirm User: ✅ Yes
4. Click "Create User"

#### Option B: Using SQL Script
Run the script in Supabase SQL Editor:
```bash
scripts/create-admin-user.sql
```

### 3. Configure Admin User
After creating the user, run this SQL to set admin role:
```sql
-- Get user ID
SELECT id, email FROM auth.users WHERE email = 'admin@greenscapelux.com';

-- Update to admin role (replace YOUR_USER_ID)
UPDATE public.users 
SET role = 'admin', is_super_admin = true 
WHERE id = 'YOUR_USER_ID';

-- Update auth metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@greenscapelux.com';
```

### 4. Verify Setup
```sql
-- Check admin user
SELECT u.id, u.email, u.role, u.is_super_admin
FROM public.users u
WHERE u.email = 'admin@greenscapelux.com';

-- Check auth metadata
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'admin@greenscapelux.com';
```

## Admin Login Flow

### 1. Access Admin Portal
Navigate to: `/admin-login`

### 2. Login Process
- Enter admin email and password
- System verifies credentials
- Checks admin role in database
- Logs login attempt
- Creates admin session
- Redirects to admin dashboard

### 3. Security Features
- All login attempts are logged
- Non-admin users are rejected
- Session expiration tracking
- IP address and user agent logging
- Audit trail for compliance

## Protected Routes

### Standard Admin Routes
Use `EnhancedAdminRoute` for regular admin access:
```tsx
<Route path="/admin-dashboard" element={
  <EnhancedAdminRoute>
    <AdminDashboard />
  </EnhancedAdminRoute>
} />
```

### Super Admin Routes
Use `requireSuperAdmin` prop for elevated access:
```tsx
<Route path="/admin/system-config" element={
  <EnhancedAdminRoute requireSuperAdmin={true}>
    <SystemConfig />
  </EnhancedAdminRoute>
} />
```

## Admin Permissions System

### Permission Levels
1. **Admin** - Standard admin access
   - View dashboards
   - Manage users
   - View reports

2. **Super Admin** - Full system access
   - System configuration
   - Database management
   - Security settings
   - User role management

### Adding Custom Permissions
```sql
-- Add custom permissions to admin user
UPDATE users
SET admin_permissions = '["manage_users", "view_analytics", "system_config"]'::jsonb
WHERE id = 'ADMIN_USER_ID';
```

## Security Monitoring

### View Login Logs
```sql
SELECT 
  email,
  ip_address,
  created_at,
  success
FROM admin_login_logs
ORDER BY created_at DESC
LIMIT 50;
```

### View Active Sessions
```sql
SELECT 
  u.email,
  s.last_activity,
  s.expires_at,
  s.ip_address
FROM admin_sessions s
JOIN users u ON u.id = s.admin_id
WHERE s.expires_at > NOW()
ORDER BY s.last_activity DESC;
```

### Failed Login Attempts
```sql
SELECT 
  email,
  ip_address,
  created_at
FROM admin_login_logs
WHERE success = false
ORDER BY created_at DESC;
```

## Best Practices

### Password Requirements
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No common words or patterns
- Rotate every 90 days

### Session Management
- Sessions expire after 24 hours of inactivity
- Force logout on password change
- Single session per admin (optional)

### Access Control
- Use least privilege principle
- Regular audit of admin users
- Remove inactive admin accounts
- Monitor login patterns

### Compliance
- All admin actions are logged
- Logs retained for 1 year minimum
- Regular security audits
- Incident response procedures

## Troubleshooting

### Admin Login Not Working
1. Verify user exists in auth.users
2. Check role in public.users table
3. Verify user_metadata has role='admin'
4. Check admin_login_logs for errors

### Access Denied After Login
1. Verify role in database matches 'admin'
2. Check RLS policies are enabled
3. Verify user_metadata is set correctly
4. Clear browser cache and retry

### Session Expired
1. Check admin_sessions table
2. Verify expires_at is in future
3. Re-login to create new session

## API Integration

### Check Admin Status
```typescript
import { supabase } from '@/lib/supabase';

async function checkAdminStatus(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('role, is_super_admin')
    .eq('id', userId)
    .single();
  
  return {
    isAdmin: data?.role === 'admin',
    isSuperAdmin: data?.is_super_admin === true
  };
}
```

### Log Admin Action
```typescript
async function logAdminAction(action: string, details: any) {
  await supabase.rpc('log_admin_action', {
    action_type: action,
    action_details: details
  });
}
```

## Support
For issues or questions, contact the development team or refer to the main documentation.
