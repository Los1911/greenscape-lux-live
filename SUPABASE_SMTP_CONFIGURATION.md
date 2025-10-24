# Supabase SMTP Configuration with Resend

## Step-by-Step Configuration

### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Navigate to your GreenScape Lux project
3. Go to **Authentication** → **Settings**

### 2. Configure SMTP Settings
```
Enable custom SMTP: ✅ Enabled

SMTP Settings:
- Host: smtp.resend.com
- Port: 587
- Username: resend
- Password: [Your Resend API Key]
- Sender name: GreenScape Lux
- Sender email: noreply@greenscapelux.com
```

### 3. Update Email Templates
In **Authentication** → **Email Templates**, customize:

#### Confirm Signup Template:
```html
<h2>Welcome to GreenScape Lux!</h2>
<p>Thanks for signing up! Please confirm your email address.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

#### Reset Password Template:
```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
```

### 4. Environment Variables
Ensure these are set in Vercel:
```
RESEND_API_KEY=your_resend_api_key_here
```

### 5. Test the Integration
1. Try password reset from app
2. Check Resend dashboard for delivery
3. Verify email styling matches brand

## Benefits
- ✅ Secure token generation (Supabase)
- ✅ Reliable delivery (Resend)
- ✅ Branded email templates
- ✅ No duplicate systems
- ✅ Built-in retry logic