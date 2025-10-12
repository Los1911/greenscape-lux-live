# Build-Time Environment Variable Validation System

## Overview

This system provides comprehensive environment variable validation that runs during both development and deployment to ensure all critical configuration is properly set before the application starts.

## Components

### 1. Build-Time Validator (`scripts/build-time-env-validator.js`)

**Purpose**: Validates all required environment variables before build/deployment
**Usage**: Automatically runs during `npm run build` and CI/CD pipelines

**Features**:
- ✅ Validates all critical environment variables (Supabase, Stripe, Google Maps, etc.)
- ✅ Pattern matching for proper format validation
- ✅ Detects placeholder values (e.g., "your_key_here", "example", etc.)
- ✅ Production-specific validations (warns about test keys in production)
- ✅ Fails build with clear error messages if critical variables are missing
- ✅ Provides fix instructions with examples

**Exit Codes**:
- `0`: All validations passed, build can proceed
- `1`: Critical errors found, build fails

### 2. Development Checker (`scripts/dev-env-checker.js`)

**Purpose**: Warns developers about environment issues during development
**Usage**: Runs automatically with `npm run dev` and `npm run env:check`

**Features**:
- ✅ Checks for missing .env.local file
- ✅ Validates .gitignore includes .env.local
- ✅ Compares .env.local with .env.local.template for missing variables
- ✅ Development-specific warnings (live keys in dev, etc.)
- ✅ Provides helpful suggestions and commands
- ✅ Non-blocking (warns but doesn't stop development)

### 3. CI/CD Integration

**GitHub Actions Workflows**:

#### Environment Validation Status (`.github/workflows/env-validation-status.yml`)
- Runs on every push/PR
- Validates environment variables from GitHub secrets
- Tests build with validated environment
- Sends Slack notifications on failure

#### Enhanced Environment Sync (`.github/workflows/env-sync-deployment.yml`)
- Multi-stage validation and deployment pipeline
- Blocks deployment if environment validation fails
- Comprehensive error reporting and notifications

### 4. React Component (`src/components/setup/EnvironmentValidator.tsx`)

**Purpose**: Runtime environment validation in the browser
**Usage**: Can be added to admin panels or development pages

**Features**:
- ✅ Real-time validation of environment variables
- ✅ Visual status indicators (✅ ❌ ⚠️)
- ✅ Detailed error messages and fix instructions
- ✅ Refresh/revalidation capability
- ✅ Responsive UI with clear status badges

## Required Environment Variables

### Critical (Build fails if missing):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_FUNCTIONS_URL=https://your-project.functions.supabase.co
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4
VITE_SITE_URL=https://greenscapelux.com
VITE_ADMIN_EMAIL=admin@greenscapelux.com
```

### Optional (Warnings only):
```bash
VITE_APP_ENV=production
```

## Validation Rules

### Pattern Validation:
- **Supabase URL**: Must match `https://[project-id].supabase.co`
- **Supabase Key**: Must be valid JWT format
- **Stripe Key**: Must start with `pk_test_` or `pk_live_`
- **Google Maps**: Must be alphanumeric API key format
- **Site URL**: Must be valid HTTP/HTTPS URL
- **Email**: Must be valid email format

### Placeholder Detection:
Automatically detects and rejects these placeholder patterns:
- `your_project`, `your_key`, `your_secret`
- `example`, `placeholder`, `replace_me`
- `todo`, `fixme`, `change_me`

### Production-Specific Rules:
- Warns if using test Stripe keys in production
- Validates environment matches deployment context
- Ensures all security-critical variables are set

## Usage

### Development:
```bash
# Check environment variables
npm run env:check

# Start development (with automatic env check)
npm run dev

# Validate environment manually
npm run env:validate
```

### Build/Deployment:
```bash
# Build with validation (fails if env issues)
npm run build

# Build development mode with validation
npm run build:dev
```

### CI/CD:
Environment validation runs automatically in GitHub Actions:
1. **env-validation** job validates all variables
2. **build-test** job runs only if validation passes
3. **deployment-ready** job confirms readiness for deployment

## Error Examples

### Missing Variable:
```
❌ VITE_STRIPE_PUBLISHABLE_KEY is required but not set
   Description: Stripe publishable key
   Example: pk_live_...
```

### Invalid Format:
```
❌ VITE_SUPABASE_URL has invalid format
   Description: Supabase project URL
   Example: https://your-project.supabase.co
   Current value: http://localhost:3000...
```

### Placeholder Value:
```
❌ VITE_GOOGLE_MAPS_API_KEY contains placeholder value
   Description: Replace with actual value
   Current value: your_google_maps_api_key_here...
```

## Fix Instructions

The system provides clear fix instructions:

1. **Local Development**: Update `.env.local` file
2. **Vercel Deployment**: Project Settings → Environment Variables
3. **GitHub Actions**: Repository Settings → Secrets and Variables
4. **Template Sync**: Compare with `.env.local.template`

## Benefits

### For Developers:
- ✅ Catch configuration issues early in development
- ✅ Clear error messages with fix instructions
- ✅ Automatic validation on every dev server start
- ✅ Visual feedback in browser components

### For DevOps:
- ✅ Prevent deployments with missing configuration
- ✅ Automated validation in CI/CD pipelines
- ✅ Slack/email notifications for failures
- ✅ GitHub issue creation for tracking

### For Production:
- ✅ Guarantee all critical services are configured
- ✅ Prevent runtime errors from missing environment variables
- ✅ Security validation (no placeholder values in production)
- ✅ Comprehensive logging and monitoring

## Integration Points

### Package.json Scripts:
```json
{
  "scripts": {
    "dev": "node scripts/dev-env-checker.js && vite",
    "build": "node scripts/build-time-env-validator.js && vite build",
    "env:check": "node scripts/dev-env-checker.js",
    "env:validate": "node scripts/build-time-env-validator.js"
  }
}
```

### GitHub Actions:
- Automatic validation on push/PR
- Deployment blocking if validation fails
- Multi-channel notifications (Slack, email, GitHub issues)

### React Components:
- Import `EnvironmentValidator` component
- Add to admin panels or development pages
- Real-time validation and status display

This system ensures that environment variable issues are caught and resolved before they can cause production problems, providing a robust foundation for reliable deployments.