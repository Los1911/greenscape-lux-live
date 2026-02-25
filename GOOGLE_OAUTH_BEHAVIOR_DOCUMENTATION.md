# Google OAuth Behavior Documentation

## GreenScape Lux — Authentication Flow Reference

**Document Status**: CANON — DO NOT MODIFY  
**Last Updated**: January 2026

---

## Overview

This document explains the expected behavior of Google OAuth sign-in within GreenScape Lux. It clarifies which screens are controlled by Google vs. GreenScape, and documents expected variations in the OAuth flow.

---

## Google OAuth Screens (NOT GreenScape UI)

### 1. "Choose an account" Screen

**What it looks like:**
- Google-branded blue/white interface
- Lists Google accounts signed into the browser
- Shows profile pictures and email addresses

**When it appears:**
- User has multiple Google accounts signed in
- First time signing in with Google OAuth
- After clearing browser cookies

**This is EXPECTED Google behavior, not a GreenScape bug.**

---

### 2. "You're signing back in" Screen

**What it looks like:**
- Google-branded interface
- Shows the user's profile picture and name
- Message: "You're signing back in to [app name]"
- "Continue" button

**When it appears:**
- User has previously authorized GreenScape Lux
- Google recognizes the returning user
- Streamlined re-authentication flow

**This is EXPECTED Google behavior, not a GreenScape bug.**

---

### 3. "Grant permissions" Screen

**What it looks like:**
- Google-branded interface
- Lists permissions being requested (email, profile)
- "Allow" and "Cancel" buttons

**When it appears:**
- First time authorizing GreenScape Lux
- If permissions were revoked and user is re-authorizing
- If GreenScape requested additional scopes

**This is EXPECTED Google behavior, not a GreenScape bug.**

---

## Why Different Users See Different Screens

### Factors That Affect the Flow:

1. **Browser State**
   - Number of Google accounts signed in
   - Whether cookies are present
   - Incognito/private mode

2. **Previous Authorization**
   - First-time users see permission screens
   - Returning users may see "signing back in" screen
   - Users who revoked access see permission screens again

3. **Device Type**
   - Mobile browsers may show different UI
   - iOS Safari vs Chrome may vary
   - Desktop vs mobile layouts differ

4. **Google Account Settings**
   - 2FA requirements
   - Security checkpoints
   - Account recovery prompts

---

## GreenScape Lux OAuth Flow

### What GreenScape Controls:

1. **"Sign in with Google" Button**
   - Located on login/signup pages
   - Initiates OAuth flow
   - Styled with GreenScape branding

2. **OAuth Callback Handling**
   - Receives tokens from Google
   - Creates/updates user profile
   - Redirects to appropriate dashboard

3. **Error Handling**
   - Displays errors if OAuth fails
   - Provides retry options
   - Shows user-friendly messages

### What GreenScape Does NOT Control:

1. Google's account selection UI
2. Google's permission consent screens
3. Google's "signing back in" confirmation
4. Google's 2FA/security prompts
5. Google's account recovery flows

---

## Troubleshooting

### User Reports "Extra Screen During Login"

**Response:**
> "The screen you're seeing is part of Google's standard sign-in process. It's not a GreenScape page. This is normal and helps Google verify your identity. Simply follow the prompts to continue signing in."

### User Reports "Different Experience Than Before"

**Response:**
> "Google's sign-in flow can vary based on your browser state, whether you're already signed into Google, and your account security settings. This variation is normal and controlled by Google, not GreenScape."

### User Cannot Complete Google Sign-In

**Check:**
1. Is the user blocking pop-ups?
2. Are third-party cookies blocked?
3. Is the user in incognito mode?
4. Does the user have a valid Google account?

---

## Mobile-Specific Considerations

### iOS Safari

- May show Google sign-in in a popup or redirect
- Address bar may hide/show during flow
- Safe area insets affect layout after redirect

### Android Chrome

- Usually shows Google sign-in as overlay
- May use Google Play Services for faster auth
- Fingerprint/face unlock may be offered

---

## Security Notes

1. **GreenScape never sees the user's Google password**
   - OAuth tokens are used, not credentials
   - Google handles all password verification

2. **Minimal permissions requested**
   - Email address (for account identification)
   - Basic profile (name, profile picture)
   - No access to Gmail, Drive, or other services

3. **Token security**
   - Tokens are stored securely by Supabase
   - Refresh tokens allow persistent sessions
   - Users can revoke access via Google Account settings

---

## Related Documentation

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GreenScape Auth Error Handling](./src/lib/authErrorHandler.ts)

---

## Summary

**Key Takeaways:**

1. ✅ Google screens during OAuth are EXPECTED and NORMAL
2. ✅ Different users may see different Google screens
3. ✅ "You're signing back in" is a Google feature, not a bug
4. ✅ GreenScape only controls the button and callback handling
5. ❌ Do NOT attempt to remove or suppress Google OAuth screens
6. ❌ Do NOT treat Google UI variations as GreenScape bugs

---

*This document is part of the GreenScape Lux authentication system documentation.*
