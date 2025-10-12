# Password Reset Flow - Global Audit Report

## 🔍 Flow Chart Analysis

### Current Password Reset Flow:

```
1. User clicks "Forgot Password" → `/forgot-password`
   ├── Client users: From ClientLogin.tsx
   └── Landscaper users: From LandscaperLogin.tsx (inline form)

2. ForgotPassword.tsx:
   ├── User enters email
   ├── Calls supabase.auth.resetPasswordForEmail()
   ├── Redirect URL: https://greenscapelux.com/reset-password
   ├── 60-second cooldown + 17-second rate limiting
   └── Backup: Attempts custom edge function 'fix-email-system'

3. Email Link Clicked → User redirected to reset page:
   ├── Client users: /reset-password
   └── Landscaper users: /simple-reset-password

4. Password Reset Pages:
   ├── ResetPassword.tsx (for clients)
   │   ├── Validates tokens (hash/search params)
   │   ├── Handles PKCE auth code exchange
   │   ├── Updates password via supabase.auth.updateUser()
   │   ├── Detects user role for redirect
   │   └── Signs out → redirects to appropriate login
   └── SimpleResetPassword.tsx (for landscapers)
       ├── Basic token validation
       ├── Updates password via supabase.auth.updateUser()
       ├── Role detection for redirect
       └── Signs out → redirects to appropriate login
```

## 🚨 Critical Issues Found

### 1. **Inconsistent Reset Flows**
- **Client Flow**: `/forgot-password` → `/reset-password`
- **Landscaper Flow**: Inline form → `/simple-reset-password`
- **Problem**: Two different reset pages with different logic

### 2. **Routing Inconsistencies**
```javascript
// App.tsx has 3 reset routes:
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/simple-reset-password" element={<SimpleResetPassword />} />
<Route path="/password-reset" element={<ResetPassword />} />  // Duplicate
```

### 3. **Hardcoded Production URLs**
```javascript
// ForgotPassword.tsx line 62
const redirectTo = `https://greenscapelux.com/reset-password`;

// LandscaperLogin.tsx line 70
redirectTo: `${window.location.origin}/simple-reset-password`
```

### 4. **Missing Edge Functions**
- ResetPassword.tsx calls non-existent functions:
  - `fix-password-reset-flow` (line 175)
  - `fix-email-system` (line 88)

### 5. **Role Detection Issues**
- Both reset pages attempt role detection for redirects
- SimpleResetPassword.tsx has simpler logic but same goal
- Potential race conditions with user data queries

## ✅ Working Components

### 1. **Core Authentication**
- `supabase.auth.resetPasswordForEmail()` works correctly
- `supabase.auth.updateUser()` updates passwords successfully
- PKCE flow handling in ResetPassword.tsx

### 2. **Security Features**
- Rate limiting (17s/60s cooldowns)
- Token validation
- Session verification
- Proper sign-out after reset

### 3. **User Experience**
- Loading states and error handling
- Success messages and redirects
- Responsive design

## 🔧 Recommendations

### 1. **Unify Reset Flow**
```
RECOMMENDED FLOW:
1. All users → /forgot-password (single entry point)
2. Email links → /reset-password (single reset page)
3. Role-based redirects after success
```

### 2. **Fix Routing**
- Remove duplicate `/password-reset` route
- Consolidate to single reset page
- Remove `/simple-reset-password` route

### 3. **Environment-Aware URLs**
```javascript
// Use dynamic URLs instead of hardcoded
const redirectTo = `${window.location.origin}/reset-password`;
```

### 4. **Remove Dead Code**
- Remove calls to non-existent edge functions
- Clean up unused backup systems

### 5. **Improve Role Detection**
```javascript
// Standardize role detection logic
const getUserRole = async (userId) => {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role || 'client';
};
```

## 📊 Current State Summary

| Component | Status | Issues | Priority |
|-----------|--------|--------|----------|
| ForgotPassword.tsx | ✅ Working | Hardcoded URLs, dead functions | Medium |
| ResetPassword.tsx | ⚠️ Partial | Dead function calls, complex logic | High |
| SimpleResetPassword.tsx | ✅ Working | Duplicate functionality | High |
| LandscaperLogin.tsx | ✅ Working | Inconsistent flow | Medium |
| ClientLogin.tsx | ✅ Working | Standard flow | Low |

## 🎯 Next Steps

1. **Immediate**: Remove dead function calls
2. **Short-term**: Unify reset pages
3. **Medium-term**: Standardize role detection
4. **Long-term**: Improve error handling and UX

The password reset flow is functional but needs consolidation and cleanup to improve maintainability and user experience.