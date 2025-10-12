# Quote Submission "Object Cannot Be Cloned" Error - Root Cause & Fix

## 🔍 Root Cause Analysis

### Error Message
```
Error: ⚠️ Email failed (quote still saved): 
{"message":"The object can not be cloned.","stack":"postMessage@[native code]..."}
```

### The Problem
The error occurs because `supabase.functions.invoke()` uses `postMessage` internally to communicate with edge functions. The **structured clone algorithm** used by `postMessage` cannot clone:
- Functions
- DOM nodes
- Circular references
- Complex nested objects with non-serializable properties

### What Was Wrong
In `GetQuoteEnhanced.tsx` (line 199-220), we were sending:
```typescript
supabase.functions.invoke('unified-email', {
  body: {
    type: 'quote_confirmation',
    to: 'admin.1@greenscapelux.com',
    data: {
      name: formData.name,
      email: formData.email,
      // ... deeply nested object
    }
  }
})
```

The edge function `send-quote-email/index.ts` expects flat structure:
```typescript
const { name, email, phone, services, propertySize, comments } = await req.json()
```

**Mismatch**: We sent nested `data` object, but edge function expects flat fields.

## ✅ The Solution

### Send Flat, Serializable Data
Only send primitive values (strings, numbers, arrays of strings):
```typescript
supabase.functions.invoke('send-quote-email', {
  body: {
    name: formData.name,
    email: formData.email,
    phone: formData.phone || '',
    services: allServices,
    propertySize: formData.propertyAddress,
    comments: formData.comments || ''
  }
})
```

## 📋 Files Fixed
1. `src/pages/GetQuoteEnhanced.tsx`
2. `src/pages/ClientQuoteForm.tsx`
