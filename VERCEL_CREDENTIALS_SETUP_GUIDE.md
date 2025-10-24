# Vercel Credentials Setup Guide

## Step 1: Get Your Vercel Token

### Option A: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "Environment Sync Token"
4. Select scope: "Full Access" (needed for env var management)
5. Copy the token immediately (it won't be shown again)

### Option B: Via Vercel CLI
```bash
vercel login
vercel whoami --token
```

## Step 2: Get Your Organization ID

### Via Vercel Dashboard:
1. Go to https://vercel.com/teams
2. Click on your team/organization
3. Go to Settings → General
4. Copy the "Team ID" (this is your ORG_ID)

### Via API (once you have token):
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.vercel.com/v2/teams
```

## Step 3: Get Your Project ID

### Via Vercel Dashboard:
1. Go to your project dashboard
2. Click Settings
3. Go to General tab
4. Copy "Project ID"

### Via API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.vercel.com/v9/projects
```

## Step 4: Add to Supabase Secrets

Once you have these values, add them as Supabase secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID` 
- `VERCEL_PROJECT_ID`

## Next Steps

After adding these secrets, the system will automatically:
1. Validate Stripe keys before deployment
2. Sync environment variables across environments
3. Block deployments with invalid keys
4. Ensure runtime validation in client dashboard