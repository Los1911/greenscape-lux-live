# Supabase Dashboard Configuration Walkthrough

## Step-by-Step Guide to Fix Password Reset Loop

### 1. Access Your Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `greenscapelux`

### 2. Navigate to Authentication Settings
1. In the left sidebar, click **Authentication**
2. Click on **Settings** tab
3. You'll see several sections to configure

### 3. Configure Site URL
**Location**: Authentication > Settings > General Settings

**Current Issue**: Site URL is likely set to localhost or incorrect domain

**Fix**:
- Find "Site URL" field
- Change from: `http://localhost:5173` or similar
- Change to: `https://greenscapelux.com`
- Click **Save**

### 4. Configure Redirect URLs
**Location**: Authentication > Settings > General Settings

**Current Issue**: Missing production redirect URLs

**Fix**:
- Find "Redirect URLs" section
- Add these URLs (one per line):
```
https://greenscapelux.com/reset-password
https://greenscapelux.com/auth/callback
https://greenscapelux.com/login
https://greenscapelux.com/landscaper-login
https://greenscapelux.com/**
```
- Click **Save**

### 5. Configure Email Templates
**Location**: Authentication > Settings > Email Templates

**Fix Reset Password Template**:
1. Click on "Reset Password" template
2. Find the reset link in the template
3. Change from: `{{ .SiteURL }}/reset-password?token={{ .Token }}`
4. Change to: `https://greenscapelux.com/reset-password?token={{ .Token }}`
5. Click **Save**

### 6. Verify Auth Flow Settings
**Location**: Authentication > Settings > Auth Flow

**Check these settings**:
- Enable email confirmations: ✅ Enabled
- Enable phone confirmations: ❌ Disabled (unless needed)
- Enable manual linking: ❌ Disabled
- Session timeout: 604800 (1 week)

### 7. Test the Configuration
After making these changes:

1. Wait 2-3 minutes for changes to propagate
2. Try the password reset flow:
   - Go to https://greenscapelux.com/forgot-password
   - Enter your email
   - Check email for reset link
   - Click the reset link
   - Should redirect to reset-password page without loop

### 8. Common Issues & Solutions

**Issue**: Still getting redirect loop
**Solution**: Clear browser cache and cookies for greenscapelux.com

**Issue**: Email links still point to incorrect domain
**Solution**: Double-check email template configuration and Site URL

**Issue**: "Invalid redirect URL" error
**Solution**: Ensure all redirect URLs are added to the list

### 9. Verification Checklist
- [ ] Site URL set to `https://greenscapelux.com`
- [ ] All redirect URLs added
- [ ] Email templates updated with correct domain
- [ ] Browser cache cleared
- [ ] Test password reset flow works

### Need Help?
If you encounter issues:
1. Check browser developer console for errors
2. Verify all URLs are exactly as shown above
3. Ensure no trailing slashes in URLs
4. Wait a few minutes between changes for propagation