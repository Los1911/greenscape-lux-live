# Supabase Configuration Update

## Summary
Updated Supabase configuration handling to prevent ConfigGate from appearing in production/preview builds when environment variables are set.

## Changes Made
1. **Updated runtimeConfig.ts**: Priority order ENV → QUERY → LOCAL → MISSING
2. **Simplified ConfigGate.tsx**: Bypasses when any valid config source is detected
3. **Created supabaseClient.ts**: Clean client factory using runtime config
4. **Added ConfigDiag.tsx**: Diagnostics overlay with ?diag=1 parameter
5. **Updated App.tsx**: Added ConfigDiag component

## Environment Variables Required
Set these in Famous Environment Variables:
- `VITE_SUPABASE_URL` = https://mwvcbedvnimabfwubazz.supabase.co
- `VITE_SUPABASE_ANON` = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## Testing
1. Visit any page with `?diag=1` to see config diagnostics
2. ConfigGate should not appear when env vars are set
3. Source should show "ENV" in production/preview builds

## Fallback Support
- Query parameter: `?sb=<base64>` where base64 contains "URL <url> ANON <key>"
- localStorage: Manual entry via ConfigGate form