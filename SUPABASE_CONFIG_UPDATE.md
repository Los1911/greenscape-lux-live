# Supabase Configuration Update

## Changes Made

### 1. Updated `src/lib/runtimeConfig.ts`
- **Priority Order**: Environment variables → Query parameters → localStorage
- **Environment Variables**: Checks for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` first
- **Query Parameter Support**: Added support for `?sb=<base64>` where base64 contains `url|anon`
- **Source Tracking**: Returns source type (`ENV`, `QUERY`, `LOCAL`, `NONE`) for debugging

### 2. Updated `src/components/ConfigGate.tsx`
- **Auto-Skip**: If environment variables are present, ConfigGate renders children directly
- **No Manual Entry**: ConfigGate only appears if env vars are missing
- **Backward Compatibility**: Still supports localStorage fallback for local development

### 3. Updated `src/components/Footer.tsx`
- **Debug Badge**: Shows current config source (ENV/QUERY/LOCAL) in footer
- **Color Coded**: Green for ENV, Blue for QUERY, Yellow for LOCAL
- **Only Visible**: When config is successfully loaded

## Environment Variables to Set

Add these to your deployment platform (Vercel, Netlify, etc.):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Expected Behavior

- **Production/Preview**: ConfigGate never appears (uses env vars)
- **Local Development**: ConfigGate appears if .env.local is missing
- **Debug Badge**: Shows which config source is active
- **Query Parameter**: Supports one-time setup via `?sb=<base64>` URL

## Query Parameter Format

To use query parameter setup:
1. Encode `url|anon` as base64
2. Add `?sb=<encoded>` to URL
3. Example: `?sb=aHR0cHM6Ly9leGFtcGxlLnN1cGFiYXNlLmNvfGV5SmhiR2NpT2lKSVV6STFOaUo5...`

The ConfigGate issue should now be resolved for production deployments.