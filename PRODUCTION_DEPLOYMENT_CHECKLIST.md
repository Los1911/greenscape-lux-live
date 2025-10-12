# Production Deployment Checklist - GreenScape Lux

## Pre-Deployment Validation

### ✅ Environment Configuration
- [ ] **API Keys Validated**: Run `EnvironmentValidator` component - all services show green
- [ ] **No Placeholders**: Verify no "your-key" or placeholder values remain
- [ ] **Production Keys**: Using live/production API keys (not test keys)
- [ ] **Environment Type**: `VITE_APP_ENV=production` set in hosting provider

### ✅ Service Configuration

#### Supabase
- [ ] **URL Configured**: `VITE_SUPABASE_URL` points to production project
- [ ] **Anon Key Valid**: `VITE_SUPABASE_ANON_KEY` is current JWT token
- [ ] **RLS Enabled**: Row Level Security policies are active
- [ ] **Auth Flows Tested**: Login, signup, password reset work end-to-end
- [ ] **Database Accessible**: Can connect and query from production domain

#### Google Maps
- [ ] **API Key Valid**: `VITE_GOOGLE_MAPS_API_KEY` starts with `AIza`
- [ ] **APIs Enabled**: Maps JavaScript API, Places API, Geocoding API enabled
- [ ] **Restrictions Set**: HTTP referrer restrictions configured for production domain
- [ ] **Billing Active**: Google Cloud billing account is active
- [ ] **Map Loading**: Interactive maps load correctly on production site

#### Stripe
- [ ] **Live Keys**: Using `pk_live_` publishable key (not test key)
- [ ] **Webhook URL**: Production webhook endpoint configured
- [ ] **Test Payments**: End-to-end payment flow tested with test card
- [ ] **Connect Setup**: Stripe Connect configured for landscaper payouts
- [ ] **Tax Settings**: Tax calculation configured if required

#### Resend (Optional)
- [ ] **API Key Valid**: `VITE_RESEND_API_KEY` starts with `re_`
- [ ] **Domain Verified**: Sending domain authenticated
- [ ] **Email Templates**: All email templates tested
- [ ] **Delivery Testing**: Test emails reach recipients

### ✅ Security Validation
- [ ] **HTTPS Enforced**: Site only accessible via HTTPS
- [ ] **CSP Headers**: Content Security Policy headers configured
- [ ] **API Endpoints Secured**: All sensitive endpoints require authentication
- [ ] **RLS Policies**: Database access properly restricted by user role
- [ ] **Input Validation**: All forms validate and sanitize input
- [ ] **Error Handling**: No sensitive data exposed in error messages

### ✅ Code Quality
- [ ] **Console Logs Removed**: No `console.log` statements in production build
- [ ] **Debug Code Removed**: No development-only code or comments
- [ ] **Error Boundaries**: React error boundaries implemented
- [ ] **Loading States**: All async operations have loading indicators
- [ ] **Build Successful**: Production build completes without errors
- [ ] **Bundle Size**: JavaScript bundle size is optimized

## Deployment Process

### Step 1: Environment Setup
1. **Set Environment Variables** in hosting provider:
   ```
   VITE_SUPABASE_URL=https://mwvcbedvnimabfwubazz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
   VITE_RESEND_API_KEY=re_your_production_key
   VITE_APP_ENV=production
   VITE_SITE_URL=https://greenscapelux.com
   VITE_ADMIN_EMAIL=cmatthews@greenscapelux.com
   ```

2. **Verify Variables**: Use hosting provider's environment variable preview

### Step 2: Build and Deploy
1. **Trigger Deployment**: Push to main branch or manual deploy
2. **Monitor Build Logs**: Check for any build errors or warnings
3. **Verify Deployment**: Confirm new version is live

### Step 3: Post-Deployment Validation
1. **Run Production Readiness Checker**: Visit `/admin` and check system status
2. **Test Critical Flows**:
   - User registration and login
   - Quote form submission
   - Payment processing
   - Map functionality
   - Email notifications

## Post-Deployment Testing

### ✅ User Authentication
- [ ] **Client Signup**: New clients can register successfully
- [ ] **Landscaper Signup**: New landscapers can register and upload documents
- [ ] **Login Flow**: Existing users can log in
- [ ] **Password Reset**: Password reset emails are delivered and work
- [ ] **Session Management**: Users stay logged in across page refreshes

### ✅ Core Functionality
- [ ] **Quote Requests**: Clients can submit quote requests
- [ ] **Job Management**: Landscapers can view and accept jobs
- [ ] **Payment Processing**: Stripe payments complete successfully
- [ ] **Map Integration**: Location selection and display works
- [ ] **File Uploads**: Document and photo uploads function
- [ ] **Email Notifications**: System emails are delivered

### ✅ Performance
- [ ] **Page Load Speed**: Pages load within 3 seconds
- [ ] **Mobile Responsive**: Site works on mobile devices
- [ ] **Image Optimization**: Images load quickly and are properly sized
- [ ] **API Response Times**: Database queries respond quickly

### ✅ Error Handling
- [ ] **404 Pages**: Custom 404 page displays for invalid URLs
- [ ] **API Errors**: Graceful error messages for API failures
- [ ] **Network Issues**: Offline/connection error handling
- [ ] **Form Validation**: Client-side and server-side validation

## Monitoring and Maintenance

### Immediate Post-Launch (First 24 Hours)
- [ ] **Monitor Error Logs**: Check hosting provider and browser console for errors
- [ ] **Test User Flows**: Manually test critical user journeys
- [ ] **Check Email Delivery**: Verify signup and notification emails work
- [ ] **Monitor Performance**: Check page load times and API response times
- [ ] **Database Health**: Verify database connections and query performance

### Ongoing Monitoring
- [ ] **Set Up Alerts**: Configure alerts for service downtime
- [ ] **API Key Rotation**: Plan regular API key rotation schedule
- [ ] **Security Updates**: Monitor for security updates to dependencies
- [ ] **Performance Monitoring**: Track Core Web Vitals and user experience
- [ ] **Backup Verification**: Ensure database backups are working

## Rollback Plan

### If Issues Arise
1. **Immediate Rollback**: Revert to previous deployment
2. **Environment Check**: Verify environment variables are correct
3. **Service Status**: Check if external services (Supabase, Stripe) are operational
4. **Error Investigation**: Review logs to identify root cause
5. **Fix and Redeploy**: Address issues and redeploy

### Emergency Contacts
- **Hosting Provider Support**: [Provider-specific support contact]
- **Supabase Support**: [Supabase support if on paid plan]
- **Stripe Support**: [Stripe support for payment issues]

## Success Criteria

### Deployment is Successful When:
- [ ] **All Services Green**: Production readiness checker shows all systems operational
- [ ] **Zero Critical Errors**: No critical errors in logs or monitoring
- [ ] **User Flows Complete**: All critical user journeys work end-to-end
- [ ] **Performance Acceptable**: Page load times under 3 seconds
- [ ] **Security Validated**: All security checks pass
- [ ] **Monitoring Active**: All monitoring and alerting systems operational

---

**🚀 Ready for Production!**

Once all checklist items are complete, GreenScape Lux is ready for production use. Remember to monitor the system closely in the first 24-48 hours after deployment.

*Last Updated: January 2025*