# Famous.co Deployment Checklist
**Project**: GreenScape Lux  
**Domain**: https://greenscapelux.com  
**Date**: October 4, 2025

---

## Pre-Deployment Steps

### 1. ✅ Environment Configuration
- [x] Fixed security middleware (line 97)
- [ ] Create `.env.production` from `.env.production.example`
- [ ] Verify all VITE_ variables are set
- [ ] Confirm NO server-side keys in .env.production

### 2. ✅ Build Process
```bash
# Install dependencies (if needed)
npm install

# Build production bundle
npm run build

# Verify dist/ folder created
ls -la dist/

# Check build size
du -sh dist/
```

### 3. ✅ Pre-Upload Verification
```bash
# Check for critical files
ls dist/index.html
ls dist/assets/
ls dist/version.json

# Verify no .env files in dist/
find dist/ -name ".env*"  # Should return nothing
```

---

## Deployment Steps

### 1. Upload to Famous.co
1. Log into Famous.co dashboard
2. Navigate to your project
3. Upload entire `dist/` folder
4. Wait for deployment to complete

### 2. DNS Verification
```bash
# Verify A record
dig greenscapelux.com +short
# Should return: 52.6.250.82

# Verify www subdomain (if configured)
dig www.greenscapelux.com +short
```

### 3. Initial Load Test
```bash
# Test main domain
curl -I https://greenscapelux.com

# Expected: HTTP/2 200 OK

# Check version
curl https://greenscapelux.com/version.json
```

---

## Post-Deployment Testing

### 1. ✅ Asset Loading
- [ ] Open https://greenscapelux.com in browser
- [ ] Check browser console (F12) - no errors
- [ ] Verify CSS loads (page styled correctly)
- [ ] Verify JS loads (interactive elements work)

### 2. ✅ Supabase Integration
- [ ] Navigate to login page
- [ ] Attempt login (should connect to Supabase)
- [ ] Check browser network tab for Supabase requests
- [ ] Verify no CORS errors

### 3. ✅ Stripe Integration
- [ ] Navigate to quote form or payment page
- [ ] Verify Stripe Elements load
- [ ] Check for Stripe.js in network tab
- [ ] Confirm live mode indicator (if visible)

### 4. ✅ Email Integration (Resend via Supabase)
- [ ] Submit quote form
- [ ] Check Supabase Edge Function logs
- [ ] Verify email sent (check recipient inbox)
- [ ] No frontend errors related to email

### 5. ✅ Google Maps Integration
- [ ] Navigate to page with map
- [ ] Verify map loads correctly
- [ ] Check for API key errors in console
- [ ] Test location search (if applicable)

---

## Troubleshooting Guide

### Issue: "Failed to load Supabase"
**Solution**:
1. Check browser console for exact error
2. Verify VITE_SUPABASE_URL in build
3. Check Supabase project status
4. Verify DNS resolves correctly

### Issue: "Stripe not loading"
**Solution**:
1. Check VITE_STRIPE_PUBLISHABLE_KEY in build
2. Verify key starts with `pk_live_`
3. Check Stripe dashboard for key status
4. Clear browser cache and retry

### Issue: "404 on page refresh"
**Solution**:
1. Verify `deploypad.json` uploaded correctly
2. Check Famous.co SPA routing settings
3. Ensure fallback: "/index.html" is set

### Issue: "Assets not loading"
**Solution**:
1. Check browser network tab
2. Verify asset paths are correct
3. Clear CDN cache (if applicable)
4. Re-upload dist/ folder

---

## Rollback Plan

If deployment fails:

### Option 1: Quick Fix
1. Identify specific issue
2. Fix locally
3. Rebuild: `npm run build`
4. Re-upload dist/ folder

### Option 2: Revert to Previous
1. Keep previous dist/ folder backup
2. Re-upload old dist/ folder
3. Fix issues in development
4. Deploy again when ready

---

## Success Criteria

✅ **Deployment Successful When**:
- [ ] Site loads at https://greenscapelux.com
- [ ] All pages accessible (no 404s)
- [ ] Login/signup works
- [ ] Quote form submits successfully
- [ ] Payments process correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable (< 3s load)

---

## Post-Deployment Actions

### 1. Monitor First 24 Hours
- Check error logs (browser console)
- Monitor Supabase dashboard for auth activity
- Check Stripe dashboard for payment activity
- Review email delivery (Resend dashboard)

### 2. Update Documentation
- [ ] Update README with new domain
- [ ] Remove Vercel references
- [ ] Document Famous deployment process
- [ ] Update team on new URL

### 3. Deprecate Old Vercel Deployment
- [ ] Remove old Vercel project (optional)
- [ ] Update any external links
- [ ] Inform stakeholders of new URL
- [ ] Set up redirects (if needed)

---

## Contact Information

**Domain Registrar**: (Your registrar)  
**DNS Provider**: (Your DNS provider)  
**Hosting**: Famous.co  
**Backend**: Supabase  
**Payments**: Stripe  
**Email**: Resend (via Supabase)

---

## Notes

- Famous.co hosts static files only (no server-side processing)
- All API calls go directly to Supabase/Stripe
- Environment variables are baked into build (not runtime)
- Fallback system prevents missing env errors
- DNS propagation may take up to 48 hours (usually < 1 hour)
