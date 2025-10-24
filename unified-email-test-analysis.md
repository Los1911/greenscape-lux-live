# Unified Email Function Test Analysis

## Current Issues Found

1. **Line 181**: Error response uses `status: 200` instead of `500`
2. **Line 91**: No validation that `token` is provided for `reset_password`
3. **Lines 173-178**: Re-parsing `req.json()` in catch block can fail

## Test Scenarios for All Email Types

### 1. RESET_PASSWORD Email Type

#### Success Case:
```json
Request:
{
  "type": "reset_password",
  "to": "user@example.com",
  "data": { "name": "John Doe" },
  "token": "abc123token"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "email-id-from-resend"
  }
}
```

#### Failure Cases:
```json
Missing Token:
Request: { "type": "reset_password", "to": "user@example.com", "data": {} }
Response: 400 Bad Request (SHOULD BE ADDED)
{ "error": "Token is required for password reset emails" }

Invalid Email:
Request: { "type": "reset_password", "to": "invalid-email", "data": {}, "token": "abc123" }
Response: 200 (SHOULD BE 500)
{ "error": "Resend API error: Invalid email address" }
```

### 2. QUOTE_CONFIRMATION Email Type

#### Success Case:
```json
Request:
{
  "type": "quote_confirmation",
  "to": "client@example.com",
  "data": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "555-1234",
    "selectedServices": ["Lawn Care", "Tree Trimming"],
    "propertySize": "Large",
    "budget": "$5000",
    "message": "Need work done ASAP"
  }
}

Response: 200 OK
{
  "success": true,
  "data": { "id": "email-id-from-resend" }
}
```

#### Failure Case:
```json
Missing Required Data:
Request: { "type": "quote_confirmation", "to": "client@example.com", "data": {} }
Response: 200 (SHOULD BE 500)
{ "error": "Template rendering failed - missing name" }
```

### 3. ADMIN_ALERT Email Type

#### Success Case:
```json
Request:
{
  "type": "admin_alert",
  "to": "admin@greenscapelux.com",
  "data": {
    "title": "New User Registration",
    "subject": "Alert: New Landscaper Signup",
    "message": "A new landscaper has registered",
    "details": { "userId": "123", "email": "pro@example.com" }
  }
}

Response: 200 OK
{
  "success": true,
  "data": { "id": "email-id-from-resend" }
}
```

#### Failure Case:
```json
Resend API Failure:
Response: 200 (SHOULD BE 500)
{ "error": "Resend API error: Rate limit exceeded" }
```

### 4. CONTACT_FORM Email Type

#### Success Case:
```json
Request:
{
  "type": "contact_form",
  "to": "admin@greenscapelux.com",
  "data": {
    "name": "Bob Johnson",
    "email": "bob@example.com",
    "phone": "555-9876",
    "subject": "Service Inquiry",
    "message": "I need landscaping services"
  }
}

Response: 200 OK
{
  "success": true,
  "data": { "id": "email-id-from-resend" }
}
```

### 5. Common Failure Cases

#### Missing Required Fields:
```json
Request: { "type": "contact_form" }
Response: 400 Bad Request
{ "error": "Missing required fields: type, to, data" }
```

#### Unknown Email Type:
```json
Request: { "type": "unknown_type", "to": "test@example.com", "data": {} }
Response: 400 Bad Request
{ "error": "Unknown email type: unknown_type" }
```

#### Missing RESEND_API_KEY:
```json
Response: 500 Internal Server Error
{ "error": "Email service not configured" }
```

## Recommended Fixes

1. **Fix error status codes**:
   ```typescript
   return new Response(JSON.stringify({ error: error.message }), {
     status: 500, // Change from 200 to 500
     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
   })
   ```

2. **Add token validation for reset_password**:
   ```typescript
   case 'reset_password':
     if (!token) {
       return new Response(JSON.stringify({ error: 'Token is required for password reset emails' }), {
         status: 400,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       })
     }
   ```

3. **Fix error logging**:
   ```typescript
   } catch (error) {
     console.error('Unified email error:', error)
     
     // Don't re-parse request, use original data if available
     return new Response(JSON.stringify({ error: error.message }), {
       status: 500,
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     })
   }
   ```