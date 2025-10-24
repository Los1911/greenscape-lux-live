# Google Maps Environment Configuration Guide

## Overview
This guide documents the configuration process for integrating Google Maps API into GreenScape Lux with proper environment variable management and error handling.

## ✅ Configuration Status
- **API Key**: ✅ Configured with production key: `AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4`
- **Environment Variables**: ✅ Updated in `.env.local.template`
- **Dynamic Loading**: ✅ Implemented with `src/lib/googleMaps.ts`
- **Error Handling**: ✅ Added validation and graceful fallbacks
- **Components Updated**: ✅ InteractiveMap.tsx and APIKeyTester.tsx

## Environment Variable Setup

### Local Development (.env.local)
```bash
# Google Maps API (Required for location services)
# Get from https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4
```

### Vercel Production Environment
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add variable:
   - **Name**: `VITE_GOOGLE_MAPS_API_KEY`
   - **Value**: `AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4`
   - **Environments**: Production, Preview, Development
3. Redeploy the application

## Technical Implementation

### 1. Google Maps Service (`src/lib/googleMaps.ts`)
- **Dynamic Loading**: Loads Google Maps API on demand
- **Validation**: Checks API key format and presence
- **Error Handling**: Graceful fallbacks for invalid/missing keys
- **Singleton Pattern**: Prevents multiple script loads

### 2. Updated Components

#### InteractiveMap Component
- Uses new Google Maps service for loading
- Displays error messages for invalid API keys
- Provides reload functionality on errors
- Validates API key before attempting to load

#### API Key Tester
- Validates Google Maps API key format
- Checks for placeholder values
- Tests key length and format compliance

### 3. Key Features
- **Validation**: Checks if API key starts with 'AIza' and has proper length
- **Placeholder Detection**: Identifies if still using placeholder values
- **Error Display**: Shows user-friendly error messages
- **Reload Option**: Allows users to reload page after fixing configuration

## Required Google Cloud APIs
Ensure these APIs are enabled in Google Cloud Console:
1. **Maps JavaScript API** - For map display
2. **Places API** - For location search and autocomplete
3. **Geocoding API** - For address to coordinates conversion
4. **Directions API** - For route optimization (optional)

## Security Configuration
In Google Cloud Console, restrict the API key to:
- **HTTP referrers**: `https://greenscapelux.com/*`, `https://*.vercel.app/*`
- **APIs**: Only enable the required APIs listed above

## Testing
Use the API Key Tester component in the admin panel to verify:
1. API key format is correct
2. Key is not using placeholder values
3. Key length meets requirements
4. Configuration is properly loaded

## Troubleshooting

### Common Issues
1. **"Invalid API key format"**: Ensure key starts with 'AIza'
2. **"Using placeholder value"**: Replace with actual Google Cloud API key
3. **"Failed to load Google Maps"**: Check network connectivity and API restrictions
4. **Map not displaying**: Verify APIs are enabled in Google Cloud Console

### Error Messages
- **Missing Key**: "Google Maps API key is missing or using placeholder value"
- **Invalid Format**: "Invalid Google Maps API key format"
- **Load Failure**: "Failed to load Google Maps API"

## Files Modified
1. `.env.local.template` - Updated with production API key
2. `src/lib/googleMaps.ts` - New Google Maps service
3. `src/components/mapping/InteractiveMap.tsx` - Updated to use new service
4. `src/components/setup/APIKeyTester.tsx` - Enhanced validation

## Next Steps
1. ✅ API key configured
2. ✅ Environment variables updated
3. ✅ Components updated with error handling
4. 🔄 Deploy to Vercel with environment variables
5. 🔄 Test map functionality in production

## Production Checklist
- [ ] Verify API key is set in Vercel environment variables
- [ ] Test map loading in production environment
- [ ] Confirm API restrictions are properly configured
- [ ] Monitor API usage and quotas in Google Cloud Console