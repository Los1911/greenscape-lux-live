# Supabase Domain Configuration Guide for greenscapelux.com

## Critical Configuration Issues

Your password reset loop is likely caused by incorrect domain configuration in Supabase. Here's exactly what needs to be fixed:

## Step 1: Site URL Configuration

1. Go to **Supabase Dashboard** → **Settings** → **Authentication**
2. Under **URL Configuration**, set:
   - **Site URL**: `https://greenscapelux.com`

## Step 2: Redirect URLs Configuration

Add these **Additional Redirect URLs** (one per line):
```
https://greenscapelux.com/**
https://greenscapelux.com/reset-password
https://greenscapelux.com/auth/callback
https://greenscapelux.com/login
https://greenscapelux.com/reset-password
https://greenscapelux.com/signup
https://greenscapelux.com/
```

**Note**: For development, you may also add localhost URLs:
```
http://localhost:5173/**
http://localhost:3000/**

## Step 3: Email Template URLs

Go to **Authentication** → **Email Templates** and update:

### Confirm Signup Template
- Redirect URL: `https://greenscapelux.com/auth/callback?type=signup`

### Invite User Template  
- Redirect URL: `https://greenscapelux.com/auth/callback?type=invite`

### Magic Link Template
- Redirect URL: `https://greenscapelux.com/auth/callback?type=magiclink`

### Reset Password Template (CRITICAL)
- Redirect URL: `https://greenscapelux.com/reset-password?type=recovery`

### Change Email Address Template
- Redirect URL: `https://greenscapelux.com/auth/callback?type=email_change`

## Step 4: Verification

After making these changes:
1. Save all configurations
2. Wait 2-3 minutes for changes to propagate
3. Test password reset flow at https://greenscapelux.com/reset-password
4. Check that email links redirect to correct domain

## Common Issues

- **Loop Problem**: Usually caused by Site URL mismatch
- **Token Invalid**: Usually caused by wrong redirect URLs in email templates
- **CORS Errors**: Usually caused by missing redirect URLs

## Quick Test

Use this URL to test your configuration:
`https://greenscapelux.com/reset-password?access_token=test&refresh_token=test&type=recovery`

If it doesn't loop, your configuration is working.