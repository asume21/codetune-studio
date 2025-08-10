#!/bin/bash
echo "🚀 Starting CodedSwitch build process..."

# Install all dependencies including dev dependencies needed for build
echo "📦 Installing dependencies with dev dependencies..."
npm install --include=dev

# Run the build
echo "🔨 Building application..."
npm run build

# Build the production server
echo "🔧 Building production server..."
npx esbuild server/index.prod.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"