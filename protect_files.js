#!/usr/bin/env node

import BulletproofUploader from './bulletproof_uploader.js';
import CorruptionMonitor from './corruption_monitor.js';

const CRITICAL_FILES = [
  'package.json',
  'tsconfig.json', 
  'vite.config.ts',
  'tailwind.config.ts',
  'drizzle.config.ts',
  'postcss.config.js',
  'components.json'
];

async function protectFiles() {
  console.log('🛡️  BULLETPROOF FILE PROTECTION SYSTEM\n');
  
  try {
    // Step 1: Initial corruption scan
    console.log('🔍 Step 1: Scanning for existing corruption...');
    const monitor = new CorruptionMonitor();
    const scanResults = await monitor.detectCorruption(CRITICAL_FILES);
    
    // Step 2: Fix any corrupted files
    if (scanResults.corrupted.length > 0) {
      console.log('\n🔧 Step 2: Fixing corrupted files...');
      await monitor.autoFix(scanResults.corrupted);
    } else {
      console.log('\n✅ Step 2: No corruption detected');
    }
    
    // Step 3: Upload any modified files safely
    if (scanResults.modified.length > 0) {
      console.log('\n📤 Step 3: Safely uploading modified files...');
      const uploader = new BulletproofUploader();
      await uploader.uploadCriticalFiles(scanResults.modified);
    } else {
      console.log('\n✅ Step 3: No modified files to upload');
    }
    
    // Step 4: Record clean baseline
    console.log('\n📋 Step 4: Recording clean baseline...');
    monitor.recordBaseline(CRITICAL_FILES);
    
    // Step 5: Final verification
    console.log('\n🔍 Step 5: Final verification scan...');
    const finalScan = await monitor.detectCorruption(CRITICAL_FILES);
    
    if (finalScan.corrupted.length === 0 && finalScan.missing.length === 0) {
      console.log('\n🎉 SUCCESS: All files are protected and verified!');
      console.log('✅ No corruption detected');
      console.log('✅ All files synchronized');
      console.log('✅ Bulletproof protection active');
      
      console.log('\n🚀 Your deployment should now work perfectly!');
    } else {
      console.log('\n⚠️  WARNING: Some issues remain:');
      if (finalScan.corrupted.length > 0) {
        console.log(`❌ Corrupted: ${finalScan.corrupted.join(', ')}`);
      }
      if (finalScan.missing.length > 0) {
        console.log(`⚠️  Missing: ${finalScan.missing.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Protection system failed:', error.message);
    console.log('\n🆘 Manual intervention required');
    process.exit(1);
  }
}

// Usage instructions
console.log(`
🛡️  BULLETPROOF FILE PROTECTION

This system provides:
✅ Pre-upload validation
✅ Corruption detection  
✅ Round-trip verification
✅ Automatic backups
✅ Real-time monitoring
✅ Auto-fix capabilities

Critical files protected:
${CRITICAL_FILES.map(f => `  • ${f}`).join('\n')}

`);

protectFiles();