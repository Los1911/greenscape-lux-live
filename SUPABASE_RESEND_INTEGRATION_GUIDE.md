# Supabase + Resend Email Integration Guide

## Current State Analysis

### ✅ WORKING FLOWS:
- **Business Emails**: Quote requests, contact forms, admin alerts via `unified-email` function
- **Auth Tokens**: Supabase generates secure tokens for signup/reset/verification

### ❌ PROBLEMATIC FLOWS:
- **Duplicate Password Reset**: Both Supabase built-in AND custom `password-reset-email` function
- **Inconsistent Delivery**: Some emails use Supabase templates, others use Resend

## Recommended Hybrid Architecture

### 1. Configure Supabase SMTP Settings
```sql
-- In Supabase Dashboard > Authentication > Settings
SMTP Settings:
- Host: smtp.resend.com
- Port: 587
- Username: resend
- Password: [RESEND_API_KEY]
- From Email: noreply@greenscapelux.com
```

### 2. Email Flow Distribution

#### SUPABASE HANDLES (with Resend delivery):
- ✅ Signup confirmation emails
- ✅ Email verification emails  
- ✅ Password reset emails
- ✅ Magic link emails

#### UNIFIED-EMAIL HANDLES:
- ✅ Quote request notifications
- ✅ Contact form submissions
- ✅ Admin alerts
- ✅ Business notifications

### 3. Implementation Steps

#### Step 1: Remove Duplicate Functions
- Delete `password-reset-email` function
- Remove references in diagnostic tools
- Clean up password reset tester

#### Step 2: Configure Supabase Auth Templates
- Update Supabase email templates with GreenScape branding
- Ensure consistent styling with Resend emails

#### Step 3: Update Auth Flows
- Keep using `supabase.auth.resetPasswordForEmail()`
- Remove custom edge function calls
- Let Supabase handle token generation and validation

## Benefits of This Approach

1. **Security**: Supabase handles sensitive auth tokens
2. **Consistency**: All emails delivered via Resend
3. **Simplicity**: No duplicate systems
4. **Reliability**: Built-in retry logic and delivery tracking
5. **Branding**: Consistent email templates across all flows

## Files to Modify

1. Remove: `supabase/functions/password-reset-email/`
2. Update: Supabase Dashboard SMTP settings
3. Clean: Diagnostic and testing utilities
4. Configure: Supabase auth email templates