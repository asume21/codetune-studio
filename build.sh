#!/bin/bash
echo "🚀 Starting CodedSwitch build process..."

# Install all dependencies including dev dependencies needed for build
echo "📦 Installing dependencies with dev dependencies..."
npm install --include=dev

# Run the build
echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"