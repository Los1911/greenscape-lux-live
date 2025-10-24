# GreenScape Lux Supabase Edge Functions

This directory contains Supabase Edge Functions for email functionality using Resend.

## Required Environment Variables

Set these in your Supabase project settings:

- `RESEND_API_KEY` - Your Resend API key for sending emails
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
- `PUBLIC_SITE_URL` - Your site URL (e.g., https://greenscapelux.com)

## Functions

### landscaper-signup-email
Sends branded welcome email to new landscaper signups.

**Endpoint:** `https://<PROJECT-REF>.functions.supabase.co/landscaper-signup-email`

**Payload:**
```json
{
  "email": "pro@example.com",
  "first_name": "Brad", 
  "last_name": "Green"
}
```

## Deployment

Deploy all functions:
```bash
supabase functions deploy landscaper-signup-email
```

Deploy individually:
```bash
supabase functions deploy landscaper-signup-email
```

## Smoke Tests

### Signup email
```bash
curl -i -X POST -H "Content-Type: application/json" \
  -d '{"email":"pro@example.com","first_name":"Brad","last_name":"Green"}' \
  https://<PROJECT-REF>.functions.supabase.co/landscaper-signup-email
```

