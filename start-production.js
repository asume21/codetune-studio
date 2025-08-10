#!/usr/bin/env node

// Production startup script
process.env.NODE_ENV = 'production';

console.log('🎵 Starting CodedSwitch Music Studio in production mode...');
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
console.log(`📡 Port: ${process.env.PORT || '5000'}`);

// Import and run the production server
import('./dist/index.prod.js')
  .then(() => {
    console.log('✅ CodedSwitch production server started successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to start production server:', error);
    process.exit(1);
  });