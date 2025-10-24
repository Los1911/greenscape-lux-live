# Supabase Password Reset Testing Guide

## Current Implementation Status ✅
- Using built-in Supabase authentication (no custom edge functions)
- ForgotPassword.tsx uses `supabase.auth.resetPasswordForEmail()`
- ResetPassword.tsx handles recovery tokens from URL hash
- All custom edge functions removed to prevent conflicts

## Required Supabase Dashboard Configuration

### 1. Email Settings (Authentication > Settings)
```
Site URL: https://your-domain.com
Redirect URLs: 
- https://greenscapelux.com/reset-password
```

### 2. Email Templates (Authentication > Email Templates)
**Reset Password Template:**
```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .SiteURL }}/reset-password#{{ .TokenHash }}">Reset Password</a></p>
<p>This link expires in {{ .RedirectTo }} hours.</p>
```

### 3. SMTP Configuration (Authentication > Settings > SMTP)
**Option A: Use Supabase Built-in Email (Recommended for testing)**
- Enable "Enable email confirmations"
- No SMTP setup needed

**Option B: Custom SMTP (Production)**
```
SMTP Host: your-smtp-host.com
SMTP Port: 587
SMTP User: your-email@domain.com
SMTP Pass: your-app-password
From Email: noreply@your-domain.com
```

## Testing Steps

### 1. Test Forgot Password Flow
1. Go to `/forgot-password`
2. Enter a valid email address
3. Click "Send Reset Link"
4. Check email inbox (including spam folder)
5. Verify success message appears

### 2. Test Reset Password Flow
1. Click the reset link from email
2. Should redirect to `/reset-password`
3. Page should show "Set New Password" form
4. Enter new password (8+ characters)
5. Confirm password matches
6. Click "Update Password"
7. Should show success message and redirect to login

### 3. Test Error Scenarios
- Invalid/expired reset link
- Mismatched passwords
- Password too short
- Network errors

## Common Issues & Solutions

### Issue: "Invalid reset link"
**Cause:** URL hash tokens not being parsed correctly
**Solution:** Check that redirect URL in Supabase matches exactly

### Issue: Email not received
**Cause:** SMTP not configured or email in spam
**Solutions:**
- Check Supabase email logs
- Verify SMTP settings
- Check spam folder
- Use built-in Supabase email for testing

### Issue: "Session expired"
**Cause:** Recovery tokens have expired (default 1 hour)
**Solution:** Request new reset link

### Issue: Infinite loading on reset page
**Cause:** URL hash missing or malformed
**Solution:** Check that email link format matches expected pattern

## Development Testing Commands

```bash
# Start development server
npm run dev

# Test with different email providers
# Gmail, Outlook, Yahoo, etc.

# Check browser console for errors
# Check Network tab for failed requests
```

## Production Checklist
- [ ] Site URL configured correctly
- [ ] Redirect URLs include production domain
- [ ] SMTP configured with production email
- [ ] Email template customized with branding
- [ ] Rate limiting configured
- [ ] Email deliverability tested

## Monitoring
- Check Supabase Auth logs for reset attempts
- Monitor email delivery rates
- Track user completion rates
- Set up alerts for failed resets