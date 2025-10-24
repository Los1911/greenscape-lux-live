# Google Maps API Setup Guide for GreenScape Lux

## Current Status
❌ **CRITICAL**: Google Maps API key is using placeholder value `your-google-maps-api-key-here`
❌ **IMPACT**: Location services, property mapping, and route optimization features are non-functional

## Required Steps

### 1. Create Google Cloud Project & Enable APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. Enable these APIs:
   - **Maps JavaScript API** (required)
   - **Places API** (for location search)
   - **Geocoding API** (for address conversion)
   - **Directions API** (for route optimization)

### 2. Create API Key
1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > API Key**
3. Copy the generated API key
4. **IMPORTANT**: Restrict the key immediately

### 3. Configure API Key Restrictions
**Application restrictions:**
- HTTP referrers (web sites)
- Add these domains:
  - `https://greenscapelux.com/*`
  - `https://www.greenscapelux.com/*`
  - `https://greenscapelux.vercel.app/*`
  - `http://localhost:*` (for development)

**API restrictions:**
- Restrict key to these APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Directions API

### 4. Update Environment Variables

**Local Development (.env.local):**
```bash
VITE_GOOGLE_MAPS_API_KEY=AIza[your-actual-api-key-here]
```

**Vercel Production:**
1. Go to Vercel Dashboard > Project Settings > Environment Variables
2. Add: `VITE_GOOGLE_MAPS_API_KEY` = `AIza[your-actual-key]`
3. Set for: Production, Preview, Development
4. Redeploy application

### 5. Verify Setup
After deployment, check:
- `/admin` dashboard shows Google Maps as ✅ valid
- Interactive maps load properly
- Location search functionality works
- Route optimization displays correctly

## Security Best Practices
- ✅ Always restrict API keys to specific domains
- ✅ Enable only required APIs
- ✅ Monitor usage in Google Cloud Console
- ✅ Set up billing alerts to prevent overuse

## Cost Considerations
- Maps JavaScript API: $7 per 1,000 loads
- Places API: $17 per 1,000 requests
- Geocoding API: $5 per 1,000 requests
- Set up billing alerts at $50-100/month

## Files That Use Google Maps
- `src/components/mapping/InteractiveMap.tsx`
- `src/components/mapping/RouteOptimizer.tsx`
- `src/components/setup/APIKeyTester.tsx`
- `src/lib/config.ts`

**PRIORITY**: HIGH - Required for core location functionality