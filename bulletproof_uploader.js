import fs from 'fs';
import crypto from 'crypto';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

class BulletproofUploader {
  constructor() {
    this.backupDir = '.file_backups';
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Create local backup with checksum
  createBackup(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const checksum = crypto.createHash('sha256').update(content).digest('hex');
    const timestamp = Date.now();
    const backupPath = `${this.backupDir}/${filePath.replace(/[\/\\]/g, '_')}_${timestamp}.backup`;
    
    fs.writeFileSync(backupPath, JSON.stringify({
      originalPath: filePath,
      content,
      checksum,
      timestamp
    }, null, 2));
    
    console.log(`📦 Backup created: ${backupPath}`);
    return { backupPath, checksum };
  }

  // Validate file integrity
  validateFile(filePath, content) {
    const fileName = filePath.split('/').pop();
    
    try {
      // JSON validation
      if (fileName.endsWith('.json')) {
        const parsed = JSON.parse(content);
        console.log(`✅ ${fileName}: Valid JSON`);
        return true;
      }
      
      // TypeScript/JavaScript validation
      if (fileName.endsWith('.ts') || fileName.endsWith('.js')) {
        // Check for corruption patterns
        const corruptionPatterns = [
          /aW1wb3J0/g,  // base64 'import'
          /ZXhwb3J0/g,  // base64 'export'
          /ewogIA/g,    // base64 '{\n  '
          /Ly8g/g       // base64 '// '
        ];
        
        for (const pattern of corruptionPatterns) {
          if (pattern.test(content)) {
            throw new Error(`Contains base64 corruption pattern: ${pattern}`);
          }
        }
        
        // Check for basic code structure
        if (!content.includes('import') && !content.includes('export') && !content.includes('function') && !content.includes('const')) {
          throw new Error('Missing expected code patterns');
        }
        
        console.log(`✅ ${fileName}: Valid code structure`);
        return true;
      }
      
      return true;
    } catch (error) {
      console.error(`❌ ${fileName}: Validation failed - ${error.message}`);
      return false;
    }
  }

  // Ultra-safe encoding with multiple checks
  ultraSafeEncode(content, filePath) {
    const fileName = filePath.split('/').pop();
    
    // Pre-encoding validation
    if (!this.validateFile(filePath, content)) {
      throw new Error('Pre-encoding validation failed');
    }
    
    // Clean UTF-8 encoding
    const utf8Buffer = Buffer.from(content, 'utf8');
    const base64Content = utf8Buffer.toString('base64');
    
    // Round-trip verification
    const decoded = Buffer.from(base64Content, 'base64').toString('utf8');
    if (decoded !== content) {
      throw new Error('Round-trip encoding verification failed');
    }
    
    // Post-encoding validation
    if (!this.validateFile(filePath, decoded)) {
      throw new Error('Post-encoding validation failed');
    }
    
    console.log(`🔒 ${fileName}: Ultra-safe encoding verified`);
    return base64Content;
  }

  // Get file with retries and validation
  async getGitHubFile(filePath, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
          }
        });

        if (response.status === 404) {
          return { exists: false, sha: null, content: null };
        }

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        
        return { exists: true, sha: data.sha, content };
      } catch (error) {
        console.log(`⚠️  Attempt ${attempt}/${maxRetries} failed for ${filePath}: ${error.message}`);
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Bulletproof upload with full verification
  async bulletproofUpload(filePath, message = null) {
    const fileName = filePath.split('/').pop();
    console.log(`🛡️  Starting bulletproof upload: ${fileName}`);
    
    try {
      // Step 1: Create backup
      const localContent = fs.readFileSync(filePath, 'utf8');
      const { backupPath, checksum } = this.createBackup(filePath);
      
      // Step 2: Validate local content
      if (!this.validateFile(filePath, localContent)) {
        throw new Error('Local file validation failed');
      }
      
      // Step 3: Get current GitHub state
      const githubFile = await this.getGitHubFile(filePath);
      
      // Step 4: Ultra-safe encoding
      const base64Content = this.ultraSafeEncode(localContent, filePath);
      
      // Step 5: Prepare upload payload
      const payload = {
        message: message || `BULLETPROOF: Safe update of ${fileName}`,
        content: base64Content
      };
      
      if (githubFile.exists) {
        payload.sha = githubFile.sha;
      }
      
      // Step 6: Upload with verification
      const uploadResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      // Step 7: Immediate verification
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for GitHub processing
      
      const verificationFile = await this.getGitHubFile(filePath);
      if (!verificationFile.exists) {
        throw new Error('File not found after upload');
      }
      
      if (!this.validateFile(filePath, verificationFile.content)) {
        throw new Error('Uploaded file failed validation');
      }
      
      if (verificationFile.content !== localContent) {
        throw new Error('Content mismatch after upload');
      }
      
      console.log(`✅ ${fileName}: Bulletproof upload successful and verified`);
      return true;
      
    } catch (error) {
      console.error(`❌ ${fileName}: Bulletproof upload failed - ${error.message}`);
      console.log(`🔄 Backup available at: ${backupPath}`);
      throw error;
    }
  }

  // Restore from backup
  restoreFromBackup(backupPath) {
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    fs.writeFileSync(backup.originalPath, backup.content);
    console.log(`🔄 Restored ${backup.originalPath} from backup`);
    return backup.originalPath;
  }

  // Upload critical files with atomic operations
  async uploadCriticalFiles(files) {
    console.log('🛡️  Starting bulletproof batch upload...\n');
    
    const results = [];
    const backups = [];
    
    try {
      // Create all backups first
      for (const filePath of files) {
        if (fs.existsSync(filePath)) {
          const backup = this.createBackup(filePath);
          backups.push({ filePath, ...backup });
        }
      }
      
      // Upload each file with full verification
      for (const filePath of files) {
        if (fs.existsSync(filePath)) {
          await this.bulletproofUpload(filePath);
          results.push({ file: filePath, status: 'success' });
        } else {
          console.log(`⚠️  ${filePath}: File not found locally`);
          results.push({ file: filePath, status: 'not_found' });
        }
      }
      
      const successful = results.filter(r => r.status === 'success');
      console.log(`\n🎉 Bulletproof upload complete: ${successful.length}/${files.length} files uploaded safely`);
      
      return results;
      
    } catch (error) {
      console.error(`\n❌ Batch upload failed: ${error.message}`);
      console.log('🔄 All backups are available for restoration');
      throw error;
    }
  }
}

export default BulletproofUploader;

// Immediate protection for critical files
if (import.meta.url === `file://${process.argv[1]}`) {
  const uploader = new BulletproofUploader();
  
  const criticalFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'drizzle.config.ts',
    'postcss.config.js',
    'components.json'
  ];
  
  uploader.uploadCriticalFiles(criticalFiles)
    .then(() => console.log('🛡️  All critical files protected'))
    .catch(error => console.error('🚨 Protection failed:', error.message));
}