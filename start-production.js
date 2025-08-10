#!/usr/bin/env node

// Production startup script
process.env.NODE_ENV = 'production';

console.log('🎵 Starting CodedSwitch Music Studio in production mode...');
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`📡 Port: ${process.env.PORT || '5000'}`);
console.log(`📁 Working Directory: ${process.cwd()}`);

// Check if build files exist
const fs = require('fs');
const path = require('path');

const distPath = path.resolve(process.cwd(), 'dist');
const publicPath = path.resolve(distPath, 'public');
const serverFile = path.resolve(distPath, 'index.prod.js');

console.log(`📂 Checking build files...`);
console.log(`   dist/ exists: ${fs.existsSync(distPath)}`);
console.log(`   dist/public/ exists: ${fs.existsSync(publicPath)}`);
console.log(`   dist/index.prod.js exists: ${fs.existsSync(serverFile)}`);

if (fs.existsSync(publicPath)) {
  const files = fs.readdirSync(publicPath);
  console.log(`   dist/public/ contains: ${files.join(', ')}`);
}

// Import and run the production server
import('./dist/index.prod.js')
  .then(() => {
    console.log('✅ CodedSwitch production server started successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to start production server:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  });