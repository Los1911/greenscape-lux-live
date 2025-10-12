# Secure API Key Management System - GreenScape Lux

## Overview
This guide documents the comprehensive API key management system implemented for GreenScape Lux, ensuring secure handling of environment variables and preventing production deployment with placeholder values.

## System Components

### 1. API Key Validator (`src/lib/apiKeyValidator.ts`)
- **Purpose**: Validates all API keys for format, presence, and placeholder detection
- **Features**:
  - Service-specific validation (Supabase, Stripe, Google Maps, Resend)
  - Placeholder pattern detection
  - Detailed error reporting with actionable messages
  - Support for optional vs required services

### 2. Environment Guard (`src/lib/environmentGuard.ts`)
- **Purpose**: Startup validation and runtime environment monitoring
- **Features**:
  - Singleton pattern for consistent state management
  - Strict mode for production environments
  - Service availability checking
  - Development debugging tools

### 3. Environment Validator Component (`src/components/setup/EnvironmentValidator.tsx`)
- **Purpose**: UI component for real-time environment validation
- **Features**:
  - Visual status indicators
  - Detailed error reporting
  - Revalidation capability
  - Integration guidance

### 4. Production Readiness Checker (`src/components/setup/ProductionReadinessChecker.tsx`)
- **Purpose**: Comprehensive production deployment validation
- **Features**:
  - Multi-layer security checks
  - Service connectivity testing
  - Debug code detection
  - HTTPS validation
  - Sensitive data masking

## API Key Configuration

### Required Services

#### Supabase
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (JWT token)
```
- **Validation**: Must contain `.supabase.co` and start with `eyJ`
- **Critical**: Yes - Required for authentication and database

#### Google Maps
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
```
- **Validation**: Must start with `AIza`
- **Critical**: Yes - Required for location services
- **Setup**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

#### Stripe
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
```
- **Validation**: Must start with `pk_`
- **Critical**: Yes - Required for payment processing
- **Setup**: [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

### Optional Services

#### Resend Email
```env
VITE_RESEND_API_KEY=re_...
```
- **Validation**: Must start with `re_`
- **Critical**: No - Email notifications will be limited without it
- **Setup**: [Resend Dashboard](https://resend.com/api-keys)

## Placeholder Detection

The system automatically detects common placeholder patterns:
- `your-key`, `your_key_here`
- `your-project`, `your_publishable_key_here`
- `example-key`, `test-key`, `placeholder`

## Environment Setup

### Development (.env.local)
```env
# Copy from .env.local.template and replace placeholders
VITE_SUPABASE_URL=https://mwvcbedvnimabfwubazz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
VITE_RESEND_API_KEY=re_your_actual_key_here
VITE_APP_ENV=development
```

### Production (Vercel/Hosting Provider)
Set the same variables in your hosting provider's environment settings:
1. **Vercel**: Project Settings → Environment Variables
2. **Netlify**: Site Settings → Environment Variables
3. **Railway**: Project → Variables

## Integration Usage

### Startup Validation
```typescript
import { environmentGuard } from '../lib/environmentGuard';

// Initialize at app startup
try {
  const validation = await environmentGuard.initialize({
    strictMode: true, // Fail fast in production
    allowPlaceholders: false // No placeholders in production
  });
  
  if (!validation.allValid) {
    // Handle validation errors
  }
} catch (error) {
  // Critical validation failure
}
```

### Component Integration
```typescript
import { EnvironmentValidator } from '../components/setup/EnvironmentValidator';

function App() {
  return (
    <div>
      <EnvironmentValidator 
        onValidationComplete={(isValid) => {
          if (!isValid) {
            // Show configuration help
          }
        }}
      />
    </div>
  );
}
```

### Runtime Service Checks
```typescript
import { environmentGuard } from '../lib/environmentGuard';

// Check if a service is properly configured
if (environmentGuard.isServiceConfigured('stripe')) {
  // Initialize Stripe
} else {
  // Show payment unavailable message
}
```

## Production Deployment Checklist

### Pre-Deployment Validation
- [ ] Run `EnvironmentValidator` component - all checks pass
- [ ] Run `ProductionReadinessChecker` - no critical issues
- [ ] Verify no placeholder values in environment variables
- [ ] Test all API endpoints with production keys
- [ ] Verify HTTPS is enabled
- [ ] Remove or disable console.log statements

### Environment Variable Setup
1. **Supabase**:
   - Copy URL and anon key from Supabase dashboard
   - Verify RLS policies are enabled
   - Test authentication flows

2. **Google Maps**:
   - Enable required APIs (Maps JavaScript API, Places API)
   - Set up API key restrictions (HTTP referrers)
   - Test map loading and geocoding

3. **Stripe**:
   - Use live keys for production (pk_live_...)
   - Set up webhooks with production URL
   - Test payment flows end-to-end

4. **Resend** (Optional):
   - Create production API key
   - Verify domain authentication
   - Test email delivery

### Deployment Steps
1. Set all environment variables in hosting provider
2. Deploy application
3. Run production readiness check
4. Test critical user flows
5. Monitor error logs for configuration issues

## Security Best Practices

### Environment Variables
- Never commit API keys to version control
- Use different keys for development/staging/production
- Regularly rotate API keys
- Monitor API key usage and set up alerts

### Validation
- Always validate environment variables at startup
- Implement graceful degradation for optional services
- Log validation errors (without exposing keys)
- Use strict mode in production environments

### Monitoring
- Set up alerts for API key validation failures
- Monitor service connectivity
- Track placeholder detection in production
- Regular security audits of environment configuration

## Troubleshooting

### Common Issues

#### "API key contains placeholder value"
- **Cause**: Using template values instead of real API keys
- **Solution**: Replace placeholder with actual key from service provider

#### "Invalid API key format"
- **Cause**: Incorrect key format or corrupted key
- **Solution**: Regenerate key from service provider dashboard

#### "Service connectivity failed"
- **Cause**: Network issues or incorrect configuration
- **Solution**: Verify API key permissions and network access

#### "Environment validation failed"
- **Cause**: Missing required environment variables
- **Solution**: Add missing variables to .env.local or hosting provider

### Debug Tools

#### Development Debug
```typescript
import { environmentGuard } from '../lib/environmentGuard';

// Show detailed configuration status
environmentGuard.debugConfiguration();
```

#### Production Monitoring
```typescript
// Check validation status
const validation = environmentGuard.getValidation();
if (!validation?.allValid) {
  console.error('Environment issues:', validation?.errors);
}
```

## Support

For additional help with API key setup:
- **Supabase**: [Documentation](https://supabase.com/docs)
- **Google Maps**: [API Documentation](https://developers.google.com/maps/documentation)
- **Stripe**: [API Reference](https://stripe.com/docs/api)
- **Resend**: [Getting Started](https://resend.com/docs)

---

*This system ensures secure, validated API key management across all environments while preventing common configuration errors that could compromise production deployments.*