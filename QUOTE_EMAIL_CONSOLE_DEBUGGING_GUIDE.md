# Quote Email Console Debugging Guide

## 🔍 Comprehensive Logging Added

I've added detailed console logging to help diagnose why quote emails aren't reaching Resend.

---

## 📋 What to Check in Browser Console

### When You Submit a Quote Request

You should see these console logs in order:

```
🚀 Starting quote submission (ClientQuoteForm)...
📝 Submitting quote to database... {name, email, services}
✅ Quote saved to database: [quote_id]
📧 [FRONTEND] Preparing to send email notification via unified-email...
📤 [FRONTEND] Email payload: {...}
🔗 [FRONTEND] Supabase URL: https://mwvcbedvnimabfwubazz.supabase.co
🔑 [FRONTEND] Anon Key present: true/false
📬 [FRONTEND] Email response received: {status, statusText, ok}
📧 [FRONTEND] Email response data: {...}
✅ [FRONTEND] Email sent successfully via unified-email
✅ Navigating to thank you page...
```

---

## 🚨 What to Look For

### 1. **Missing Anon Key**
```
🔑 [FRONTEND] Anon Key present: false
```
**Problem:** Environment variable not loaded
**Fix:** Check `.env.local` has `VITE_SUPABASE_ANON_KEY`

### 2. **Failed Email Response**
```
⚠️ [FRONTEND] Email failed (quote still saved): {status: 400, data: {...}}
```
**Problem:** Edge function rejected the request
**Check:** The `data` object for error details

### 3. **Network Error**
```
❌ [FRONTEND] Email request failed (quote still saved): {message: "Failed to fetch"}
```
**Problem:** Cannot reach edge function
**Check:** 
- Supabase URL is correct
- Edge function is deployed
- No CORS issues

---

## 🔧 Edge Function Logs (Supabase Dashboard)

Go to: **Supabase Dashboard → Edge Functions → unified-email → Logs**

You should see:

```
📨 [UNIFIED-EMAIL] Received request
📋 [UNIFIED-EMAIL] Request body: {...}
🔍 [UNIFIED-EMAIL] Parsed fields: {templateType, to, ...}
📝 [UNIFIED-EMAIL] Processing quote_confirmation template
✅ [UNIFIED-EMAIL] Quote template generated
📧 [UNIFIED-EMAIL] Sending email via Resend...
📧 [RESEND] Attempting to send email... {to, from, subject}
📤 [RESEND] Attempt 1/3 - Calling Resend API...
📬 [RESEND] Response received: {status, ok, data}
✅ [RESEND] Email sent successfully!
✅ [UNIFIED-EMAIL] Email sent successfully, returning response
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Edge Function Not Receiving Request
**Symptoms:**
- No logs in Supabase Edge Function dashboard
- Frontend shows network error

**Solutions:**
1. Check edge function is deployed: `supabase functions list`
2. Verify URL is correct in frontend
3. Check CORS headers are present

### Issue 2: Resend API Key Missing
**Symptoms:**
```
❌ [RESEND] Attempt 1 failed: Unauthorized
```

**Solutions:**
1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Verify `RESEND_API_KEY` is set
3. Get key from: https://resend.com/api-keys

### Issue 3: Template Data Malformed
**Symptoms:**
```
❌ [UNIFIED-EMAIL] Missing subject or content after processing
```

**Solutions:**
1. Check `emailPayload` in frontend console
2. Verify all required fields are present:
   - `name`
   - `email`
   - `services` (array)
   - `address`

### Issue 4: Wrong Email Address
**Symptoms:**
- Email sends successfully but not received

**Solutions:**
1. Check `to` field in logs: should be `admin.1@greenscapelux.com`
2. Verify email address in Resend dashboard
3. Check spam folder

---

## 📊 Testing Steps

### Step 1: Submit a Quote
1. Go to production site
2. Submit a quote request
3. Open browser console (F12)

### Step 2: Check Frontend Logs
Look for the sequence of logs above. Note any errors.

### Step 3: Check Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → unified-email
3. Click "Logs" tab
4. Look for recent invocations

### Step 4: Check Resend Dashboard
1. Go to https://resend.com/emails
2. Look for recent email attempts
3. Check delivery status

---

## 🎯 Quick Diagnostic Checklist

- [ ] Frontend shows "Email sent successfully"
- [ ] Edge function logs show request received
- [ ] Edge function logs show Resend API called
- [ ] Resend API returns 200 OK
- [ ] Email appears in Resend dashboard
- [ ] Email delivered to inbox (check spam)

---

## 📞 Next Steps

After submitting a quote request, share:

1. **Frontend console logs** (copy/paste from browser)
2. **Edge function logs** (from Supabase dashboard)
3. **Any error messages** you see

This will help identify exactly where the email flow is breaking.
