# Social Authentication Implementation

## Overview

This document describes the implementation of social authentication (Google and Apple Sign-In) for the GreenScape Lux application.

## Features Implemented

### 1. Social Auth Buttons Component
**File:** `src/components/auth/SocialAuthButtons.tsx`

- Google Sign-In button with official Google branding
- Apple Sign-In button with official Apple branding
- Loading states with spinner indicators
- Compact variant for smaller layouts
- Error handling with user-friendly messages
- Disabled state support

### 2. Social Auth Utility Library
**File:** `src/lib/socialAuth.ts`

- `signInWithSocialProvider()` - Initiates OAuth flow with Google or Apple
- `handleOAuthCallback()` - Processes OAuth redirect and establishes session
- `handleAccountLinking()` - Links social auth to existing profiles or creates new ones
- `getLinkedProviders()` - Returns list of social providers linked to account
- `linkSocialProvider()` - Links additional social provider to existing account
- `unlinkSocialProvider()` - Removes social provider from account
- Error message translation for user-friendly display

### 3. OAuth Callback Handler
**File:** `src/pages/AuthCallback.tsx`

- Processes OAuth redirects from Google/Apple
- Displays loading, success, and error states
- Redirects to appropriate dashboard based on user role
- Handles OAuth errors gracefully

### 4. Updated Login Screen
**File:** `src/components/auth/UnifiedPortalAuth.tsx`

- Social auth buttons displayed prominently above email/password form
- "or continue with email" divider
- Role selection (Client/Professional) affects social auth profile creation
- Error handling for failed social auth attempts
- Terms of Service and Privacy Policy links

## OAuth Flow

```
1. User clicks "Continue with Google" or "Continue with Apple"
   ↓
2. Role intent stored in localStorage (client/landscaper)
   ↓
3. Supabase OAuth initiated with redirect URL
   ↓
4. User authenticates with Google/Apple
   ↓
5. Redirect to /auth/callback with session tokens
   ↓
6. AuthCallback processes session:
   - Validates session
   - Handles account linking
   - Creates profile if new user
   ↓
7. AuthContext resolves user role
   ↓
8. Redirect to appropriate dashboard
```

## Account Linking Logic

When a user signs in with social auth:

1. **New User Flow:**
   - Create profile with role from localStorage intent
   - Extract name from social provider metadata
   - Create client or landscaper record based on role
   - Update user metadata with role

2. **Existing User Flow:**
   - If profile exists, use existing role
   - No duplicate profile creation

## Error Handling

The implementation handles these error scenarios:

- `popup_closed_by_user` - User cancelled the sign-in
- `access_denied` - User denied permissions
- `invalid_request` - OAuth configuration issue
- `temporarily_unavailable` - Provider service issue
- `email_not_confirmed` - Email verification required
- `user_already_exists` - Account exists with different auth method
- `provider_disabled` - OAuth provider not configured

## Supabase Configuration Required

To enable social auth in production, configure these in Supabase Dashboard:

### Google OAuth
1. Go to Authentication > Providers > Google
2. Enable Google provider
3. Add Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Add authorized redirect URL to Google Console

### Apple OAuth
1. Go to Authentication > Providers > Apple
2. Enable Apple provider
3. Add Apple OAuth credentials:
   - Service ID
   - Team ID
   - Key ID
   - Private Key
4. Configure Apple Developer Portal with redirect URL

### Redirect URLs
Add these URLs to both Supabase and OAuth provider settings:
- Development: `http://localhost:5173/auth/callback`
- Production: `https://yourdomain.com/auth/callback`

## Testing

### Manual Testing Steps

1. **Google Sign-In (Login Tab)**
   - Click "Continue with Google"
   - Complete Google sign-in
   - Verify redirect to client dashboard

2. **Apple Sign-In (Login Tab)**
   - Click "Continue with Apple"
   - Complete Apple sign-in
   - Verify redirect to client dashboard

3. **Social Sign-Up as Professional**
   - Switch to Sign Up tab
   - Select "Professional" role
   - Click "Continue with Google"
   - Verify landscaper record created
   - Verify redirect to landscaper dashboard

4. **Error Handling**
   - Cancel OAuth popup
   - Verify error message displayed
   - Verify form still functional

## Files Modified/Created

- `src/lib/socialAuth.ts` - NEW: Social auth utilities
- `src/components/auth/SocialAuthButtons.tsx` - NEW: Social auth UI
- `src/pages/AuthCallback.tsx` - NEW: OAuth callback handler
- `src/components/auth/UnifiedPortalAuth.tsx` - MODIFIED: Added social auth
- `src/App.tsx` - MODIFIED: Added /auth/callback route

## Security Considerations

1. OAuth tokens are handled by Supabase, never exposed to frontend
2. Role intent stored in localStorage is validated server-side
3. Account linking verifies user identity before creating profiles
4. PKCE flow used for enhanced security
5. Session tokens stored securely by Supabase client
