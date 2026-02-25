# Login Flow Test Guide

## Pre-Test Setup
Open browser DevTools Console (F12) to see detailed logs prefixed with:
- `[AUTH_CTX:*]` - AuthContext events
- `[UNIFIED_AUTH:*]` - Login page events  
- `[PORTAL:*]` - Portal auth events
- `[CLIENT_DASHBOARD]` - Client dashboard
- `[LANDSCAPER_DASHBOARD]` - Landscaper dashboard
- `[ADMIN_DASHBOARD]` - Admin dashboard

---

## Test 1: Client Login → /client-dashboard

**Steps:**
1. Go to `/portal-login` or `/unified-auth`
2. Enter client credentials
3. Click "Sign In"

**Expected Console Logs:**
```
[UNIFIED_AUTH:LOGIN] === LOGIN ATTEMPT ===
[AUTH_CTX:HANDLER] === EVENT: SIGNED_IN ===
[AUTH_CTX:SYNC] Starting profile sync...
[AUTH_CTX:ROLE] ✅ Role set: client
[UNIFIED_AUTH:AUTH_WATCH] ✅ Role detected, navigating to: /client-dashboard
```

**Expected Result:** Redirect to `/client-dashboard`

---

## Test 2: Landscaper Login → /landscaper-dashboard

**Steps:**
1. Go to `/portal-login`
2. Enter landscaper credentials
3. Click "Sign In"

**Expected Console Logs:**
```
[AUTH_CTX:ROLE] ✅ Role set: landscaper
[PORTAL:AUTH_WATCH] ✅ Role detected, navigating to: /landscaper-dashboard
```

**Expected Result:** Redirect to `/landscaper-dashboard`

---

## Test 3: Admin Login → /admin-dashboard

**Steps:**
1. Go to `/admin-login` or `/portal-login`
2. Enter admin credentials (admin.1@greenscapelux.com)
3. Click "Sign In"

**Expected Result:** Redirect to `/admin-dashboard`

---

## Test 4: Logout and Re-Login

**Steps:**
1. While logged in, click "Logout"
2. Verify redirect to `/portal-login`
3. Login again with same credentials

**Expected Console Logs:**
```
[LOGOUT] === LOGOUT INITIATED ===
[LOGOUT] signOut successful
[LOGOUT] Session after logout: null (good)
```

**Expected Result:** Clean logout, then successful re-login

---

## Test 5: Page Refresh While Logged In

**Steps:**
1. Login as any role
2. Press F5 or Ctrl+R to refresh
3. Wait for page to load

**Expected Console Logs:**
```
[AUTH_CTX:INIT] === AuthProvider MOUNTING ===
[AUTH_CTX:INIT] Got session: true
[AUTH_CTX:HANDLER] === EVENT: INITIAL_SESSION ===
[AUTH_CTX:ROLE] ✅ Role set: [your-role]
```

**Expected Result:** Stay on same dashboard, no redirect to login

---

## Test 6: Wrong Dashboard Access (Role Guard)

**Steps:**
1. Login as client
2. Manually navigate to `/landscaper-dashboard`

**Expected Console Logs:**
```
[LANDSCAPER_DASHBOARD] Role check { role: 'client', hasUser: true }
[LANDSCAPER_DASHBOARD] Client on landscaper dashboard - redirecting
```

**Expected Result:** Auto-redirect to `/client-dashboard`

---

## Test 7: Direct Dashboard Access Without Login

**Steps:**
1. Clear all cookies/storage (or use incognito)
2. Navigate directly to `/client-dashboard`

**Expected Result:** Redirect to `/portal-login`

---

## Troubleshooting

### Infinite Loading
- Check console for `[AUTH_CTX:TIMEOUT] ⚠️ SAFETY TIMEOUT`
- If seen, auth is taking too long - check network/Supabase

### Login Loop
- Look for repeated `[AUTH_CTX:HANDLER] SKIP - Already processed`
- If NOT seen, check `redirectAttemptedRef` in login component

### Wrong Dashboard
- Check `[*_DASHBOARD] Role check` logs
- Verify role matches expected value

### Session Not Persisting
- Check localStorage for `greenscape-lux-auth` key
- Verify it contains valid session data
