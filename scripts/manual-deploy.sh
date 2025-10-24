#!/bin/bash

# GreenScape Lux Manual Deployment Script
echo "🚀 Starting GreenScape Lux deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix build errors and try again."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app should be live at https://greenscapelux.com"
    echo "📊 Check deployment status: vercel ls"
else
    echo "❌ Deployment failed! Check Vercel logs for details."
    exit 1
fi

# Verify deployment
echo "🔍 Verifying deployment..."
curl -s -o /dev/null -w "%{http_code}" https://greenscapelux.com

echo "🎉 GreenScape Lux deployment complete!"
echo "Visit: https://greenscapelux.com"