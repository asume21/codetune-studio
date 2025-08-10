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

# Create production wrapper for npm start compatibility
echo "🔧 Creating production wrapper..."
cat > dist/index.js << 'EOF'
// Production server wrapper that forces the correct production setup
process.env.NODE_ENV = 'production';

console.log('🎵 CodedSwitch Production Server Starting...');
console.log(`📡 Port: ${process.env.PORT || '5000'}`);

// Import the production server
import('./index.prod.js')
  .then(() => {
    console.log('✅ CodedSwitch Music Studio is now live!');
  })
  .catch((error) => {
    console.error('❌ Production server failed:', error);
    process.exit(1);
  });
EOF

echo "✅ Build completed successfully!"