#!/bin/bash

echo "🚀 Building CodedSwitch Studio for production..."

# Install dependencies
npm install

# Build frontend with Vite
echo "📦 Building frontend..."
npx vite build

# Build backend with esbuild
echo "⚙️ Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"