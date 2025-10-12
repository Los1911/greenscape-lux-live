# Vercel Environment Sync Setup Guide

This guide explains how to set up automated synchronization between your local `.env.local` file and Vercel deployment environment variables.

## Prerequisites

### 1. Get Vercel API Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile picture → Settings
3. Navigate to "Tokens" in the left sidebar
4. Click "Create Token"
5. Name it "Environment Sync" and set expiration as needed
6. Copy the token (starts with `vercel_`)

### 2. Get Project ID

1. Go to your project in Vercel Dashboard
2. Click on Settings tab
3. Copy the Project ID from the General section

### 3. Configure Local Environment

Add these to your `.env.local` file:

```bash
# Vercel API Configuration (for env sync)
VERCEL_TOKEN=vercel_your_token_here
VERCEL_PROJECT_ID=your_project_id_here
```

## Usage

### Validate Environment Sync

Check if local and Vercel environments are in sync:

```bash
npm run env:validate-sync
```

### Sync Local to Vercel

Push all local environment variables to Vercel:

```bash
npm run env:sync-to-vercel
```

### Sync Vercel to Local

Pull Vercel environment variables to local (be careful - this overwrites local):

```bash
npm run env:sync-from-vercel
```

### Validate Local Environment

Check if local environment variables are properly configured:

```bash
npm run env:validate
```

## Features

### 🔍 Environment Comparison

The sync tool compares your local and Vercel environments and reports:

- ✅ **Matched keys**: Variables that exist in both environments with same values
- ❌ **Missing in Vercel**: Variables in local but not in Vercel
- ⚠️ **Missing in local**: Variables in Vercel but not in local
- 🔄 **Mismatched values**: Variables with different values between environments

### 🔐 Security Features

- Encrypted storage in Vercel
- Placeholder detection and warnings
- API key format validation
- Safe value truncation in logs

### 📊 Validation Reports

Generate detailed validation reports:

```bash
npm run env:report
```

This creates `ENV_VALIDATION_REPORT.json` with complete environment analysis.

## Common Workflows

### Initial Setup

1. Configure all keys in `.env.local`
2. Validate local environment: `npm run env:validate`
3. Sync to Vercel: `npm run env:sync-to-vercel`
4. Validate sync: `npm run env:validate-sync`

### Adding New Keys

1. Add key to `.env.local`
2. Sync to Vercel: `npm run env:sync-to-vercel`
3. Deploy to apply changes

### Production Deployment

1. Validate all environments: `npm run env:validate`
2. Ensure sync is complete: `npm run env:validate-sync`
3. Deploy with confidence

## Troubleshooting

### "VERCEL_TOKEN environment variable required"

Add your Vercel API token to `.env.local`:
```bash
VERCEL_TOKEN=vercel_your_actual_token_here
```

### "Failed to fetch Vercel environment variables"

Check that:
- Your Vercel token is valid and not expired
- Your project ID is correct
- You have access to the project

### Sync Not Working

1. Verify token permissions
2. Check project ID is correct
3. Ensure you're not hitting API rate limits
4. Try validating first: `npm run env:validate-sync`

## Best Practices

1. **Always validate before deploying**
2. **Keep local and Vercel in sync**
3. **Use placeholder detection to catch configuration issues**
4. **Generate reports for audit trails**
5. **Never commit real API keys to version control**

## Security Notes

- API tokens are stored locally only
- Vercel encrypts all environment variables
- Values are truncated in logs for security
- Placeholder patterns are detected and flagged

## Integration with CI/CD

Add to your deployment workflow:

```yaml
- name: Validate Environment Sync
  run: npm run env:validate-sync
  
- name: Sync Environment Variables
  run: npm run env:sync-to-vercel
  if: github.ref == 'refs/heads/main'
```