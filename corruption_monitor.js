import fs from 'fs';
import crypto from 'crypto';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

class CorruptionMonitor {
  constructor() {
    this.checksumFile = '.file_checksums.json';
    this.loadChecksums();
  }

  loadChecksums() {
    try {
      this.checksums = fs.existsSync(this.checksumFile) 
        ? JSON.parse(fs.readFileSync(this.checksumFile, 'utf8'))
        : {};
    } catch {
      this.checksums = {};
    }
  }

  saveChecksums() {
    fs.writeFileSync(this.checksumFile, JSON.stringify(this.checksums, null, 2));
  }

  getFileChecksum(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async getGitHubChecksum(filePath) {
    try {
      const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return null;
    }
  }

  // Record baseline checksums
  recordBaseline(files) {
    console.log('📋 Recording file baselines...');
    
    for (const filePath of files) {
      if (fs.existsSync(filePath)) {
        const checksum = this.getFileChecksum(filePath);
        this.checksums[filePath] = {
          local: checksum,
          github: null,
          lastCheck: Date.now()
        };
        console.log(`✅ ${filePath}: Baseline recorded`);
      }
    }
    
    this.saveChecksums();
    console.log('💾 Baselines saved');
  }

  // Detect changes and corruption
  async detectCorruption(files) {
    console.log('🔍 Scanning for corruption...\n');
    
    const results = {
      clean: [],
      corrupted: [],
      modified: [],
      missing: []
    };

    for (const filePath of files) {
      try {
        if (!fs.existsSync(filePath)) {
          results.missing.push(filePath);
          console.log(`⚠️  ${filePath}: Missing locally`);
          continue;
        }

        const localChecksum = this.getFileChecksum(filePath);
        const githubChecksum = await this.getGitHubChecksum(filePath);
        
        if (!githubChecksum) {
          results.missing.push(filePath);
          console.log(`⚠️  ${filePath}: Missing on GitHub`);
          continue;
        }

        const baseline = this.checksums[filePath];
        
        if (localChecksum === githubChecksum) {
          results.clean.push(filePath);
          console.log(`✅ ${filePath}: Clean and synchronized`);
        } else {
          // Check if local was intentionally modified
          if (baseline && localChecksum !== baseline.local) {
            results.modified.push(filePath);
            console.log(`📝 ${filePath}: Modified locally (needs upload)`);
          } else {
            results.corrupted.push(filePath);
            console.log(`❌ ${filePath}: CORRUPTION DETECTED`);
          }
        }

        // Update checksums
        this.checksums[filePath] = {
          local: localChecksum,
          github: githubChecksum,
          lastCheck: Date.now()
        };

      } catch (error) {
        results.corrupted.push(filePath);
        console.log(`❌ ${filePath}: Error during check - ${error.message}`);
      }
    }

    this.saveChecksums();
    
    console.log('\n📊 Corruption Scan Results:');
    console.log(`✅ Clean: ${results.clean.length}`);
    console.log(`📝 Modified: ${results.modified.length}`);
    console.log(`❌ Corrupted: ${results.corrupted.length}`);
    console.log(`⚠️  Missing: ${results.missing.length}`);
    
    return results;
  }

  // Auto-fix corrupted files
  async autoFix(corruptedFiles) {
    console.log('🔧 Auto-fixing corrupted files...\n');
    
    const BulletproofUploader = (await import('./bulletproof_uploader.js')).default;
    const uploader = new BulletproofUploader();
    
    for (const filePath of corruptedFiles) {
      try {
        console.log(`🔄 Fixing ${filePath}...`);
        await uploader.bulletproofUpload(filePath, `AUTO-FIX: Restore corrupted ${filePath}`);
        console.log(`✅ ${filePath}: Fixed successfully`);
      } catch (error) {
        console.log(`❌ ${filePath}: Auto-fix failed - ${error.message}`);
      }
    }
  }

  // Continuous monitoring
  async startMonitoring(files, intervalMinutes = 5) {
    console.log(`🔄 Starting continuous monitoring (every ${intervalMinutes} minutes)...\n`);
    
    const monitor = async () => {
      const results = await this.detectCorruption(files);
      
      if (results.corrupted.length > 0) {
        console.log('\n🚨 CORRUPTION DETECTED - Auto-fixing...');
        await this.autoFix(results.corrupted);
      }
      
      console.log(`\n⏰ Next check in ${intervalMinutes} minutes...`);
    };
    
    // Initial check
    await monitor();
    
    // Set up interval
    setInterval(monitor, intervalMinutes * 60 * 1000);
  }
}

export default CorruptionMonitor;

// Run monitoring if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new CorruptionMonitor();
  
  const criticalFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'drizzle.config.ts',
    'postcss.config.js',
    'components.json'
  ];
  
  // Record baseline and start monitoring
  monitor.recordBaseline(criticalFiles);
  monitor.startMonitoring(criticalFiles, 10); // Check every 10 minutes
}