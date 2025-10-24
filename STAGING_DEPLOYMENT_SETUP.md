# Staging Deployment Setup Guide

## Overview
This guide sets up automated staging deployments that trigger on pull requests, deploy to Vercel staging environment, and run automated tests before production.

## Required GitHub Secrets

### Vercel Configuration
```
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id  
VERCEL_TOKEN=your_vercel_token
```

### Staging Environment Variables
```
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your_staging_anon_key
STAGING_STRIPE_PUBLISHABLE_KEY=pk_test_staging_key
STAGING_STRIPE_SECRET_KEY=sk_test_staging_key
STAGING_STRIPE_WEBHOOK_SECRET=whsec_staging_webhook_secret
STAGING_GOOGLE_MAPS_API_KEY=your_staging_maps_key
STAGING_SITE_URL=https://staging.greenscapelux.com
```

### Slack Integration
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
```

## Setup Steps

### 1. Create Staging Supabase Project
```bash
# Create new Supabase project for staging
# Copy production schema to staging
# Update STAGING_SUPABASE_* secrets in GitHub
```

### 2. Setup Staging Stripe Account
```bash
# Use Stripe test mode for staging
# Create staging webhook endpoints
# Update STAGING_STRIPE_* secrets in GitHub
```

### 3. Configure Vercel Staging Environment
```bash
# Install Vercel CLI
npm i -g vercel@latest

# Link to your project
vercel link

# Get project details
vercel project ls
```

### 4. Add GitHub Secrets
Go to GitHub repository → Settings → Secrets and variables → Actions

Add all required secrets listed above.

### 5. Configure Package.json Scripts
```json
{
  "scripts": {
    "test:e2e:staging": "playwright test --config=playwright.staging.config.ts",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

## Workflow Triggers

### Pull Request Events
- `opened`: New PR created
- `synchronize`: PR updated with new commits  
- `reopened`: Closed PR reopened

### Deployment Process
1. **Code Quality Checks**
   - ESLint validation
   - TypeScript compilation
   - Unit tests execution
   - Build verification

2. **Staging Deployment**
   - Environment variable sync
   - Vercel preview deployment
   - E2E test execution
   - Slack notifications

## Testing Strategy

### Unit Tests
```bash
npm run test
```

### E2E Tests on Staging
```bash
npm run test:e2e:staging
```

### Manual Testing Checklist
- [ ] Authentication flows
- [ ] Payment processing
- [ ] Database operations
- [ ] API integrations
- [ ] Mobile responsiveness

## Monitoring & Notifications

### Slack Notifications
- ✅ Successful deployments
- ❌ Failed deployments  
- 📊 Test results summary
- 🔗 Staging URL links

### Deployment URLs
Staging URLs follow pattern:
```
https://your-app-git-branch-name-username.vercel.app
```

## Troubleshooting

### Common Issues

1. **Environment Variable Sync Failures**
```bash
# Check Vercel token permissions
vercel whoami

# Manually sync variables
node scripts/staging-env-sync.js
```

2. **Test Failures**
```bash
# Run tests locally first
npm run test:e2e:staging

# Check staging environment
curl https://your-staging-url.vercel.app/health
```

3. **Deployment Failures**
```bash
# Check Vercel logs
vercel logs your-deployment-url

# Verify build locally
npm run build
```

## Security Considerations

- Staging uses test API keys only
- No production data in staging
- Limited access to staging environment
- Regular security updates

## Next Steps

After staging deployment succeeds:
1. Review staging environment
2. Run manual testing
3. Approve pull request
4. Merge triggers production deployment