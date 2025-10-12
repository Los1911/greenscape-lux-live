# Unified Email Admin Address Update

## Changes Required

### 1. Update unified-email Edge Function
Replace current function with code that:
- Sends admin emails to `admin.1@greenscapelux.com` (not admin@)
- Sends TWO emails for quote_confirmation:
  - Admin notification to admin.1@greenscapelux.com
  - Client confirmation to customer's email
- Uses `noreply@greenscapelux.com` as sender
- Logs both emails separately

### 2. Deploy via Supabase Dashboard
1. Go to Edge Functions > unified-email
2. Replace with updated code (see below)
3. Deploy to Production

### 3. Updated Code
See supabase/functions/unified-email/index.ts

Key changes:
- Line 42: quoteAdminTemplate (admin notification)
- Line 57: quoteClientTemplate (customer confirmation)
- Lines 173-217: Dual email sending for quote_confirmation
- All admin emails now go to admin.1@greenscapelux.com

## Verification
Test quote submission sends to:
- Admin: admin.1@greenscapelux.com ✓
- Client: carlosmatthews@gmail.com ✓
