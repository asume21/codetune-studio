import fs from 'fs';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

// Critical files that need extra validation
const CRITICAL_FILES = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'drizzle.config.ts',
  'postcss.config.js',
  'components.json'
];

class SafeGitHubUploader {
  constructor() {
    this.uploadQueue = [];
    this.maxRetries = 3;
  }

  // Validate file content before upload
  validateFile(filePath, content) {
    const fileName = path.basename(filePath);
    
    try {
      // JSON validation
      if (fileName.endsWith('.json')) {
        JSON.parse(content);
        console.log(`✅ ${fileName}: Valid JSON`);
      }
      
      // TypeScript/JavaScript validation
      if (fileName.endsWith('.ts') || fileName.endsWith('.js')) {
        // Check for common syntax patterns
        if (!content.includes('import') && !content.includes('export') && !content.includes('module')) {
          throw new Error('Missing expected syntax patterns');
        }
        console.log(`✅ ${fileName}: Valid code structure`);
      }
      
      // Check for base64 corruption
      if (content.includes('aW1wb3J0') || content.includes('ZXhwb3J0') || content.includes('ewogIA')) {
        throw new Error('Contains base64 corruption patterns');
      }
      
      return true;
    } catch (error) {
      console.error(`❌ ${fileName}: Validation failed - ${error.message}`);
      return false;
    }
  }

  // Safe base64 encoding with validation
  safeEncode(content, fileName) {
    try {
      // Ensure content is clean UTF-8
      const cleanContent = content.toString('utf8');
      
      // Validate before encoding
      if (!this.validateFile(fileName, cleanContent)) {
        throw new Error('Content validation failed');
      }
      
      // Create buffer and encode
      const buffer = Buffer.from(cleanContent, 'utf8');
      const base64 = buffer.toString('base64');
      
      // Verify round-trip integrity
      const decoded = Buffer.from(base64, 'base64').toString('utf8');
      if (decoded !== cleanContent) {
        throw new Error('Round-trip encoding verification failed');
      }
      
      console.log(`✅ ${fileName}: Safe encoding verified`);
      return base64;
      
    } catch (error) {
      console.error(`❌ ${fileName}: Encoding failed - ${error.message}`);
      throw error;
    }
  }

  // Get file SHA with retry logic
  async getFileSha(filePath, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.sha;
        }
        return null;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }

  // Safe upload with comprehensive validation
  async safeUpload(filePath, content, message) {
    const fileName = path.basename(filePath);
    
    try {
      console.log(`🔄 Safely uploading ${fileName}...`);
      
      // Get current SHA
      const sha = await this.getFileSha(filePath);
      
      // Safe encoding with validation
      const base64Content = this.safeEncode(content, fileName);
      
      // Prepare upload payload
      const payload = {
        message: `SAFE UPLOAD: ${message}`,
        content: base64Content
      };
      
      if (sha) {
        payload.sha = sha;
      }
      
      // Upload with validation
      const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      // Verify upload integrity
      await this.verifyUpload(filePath, content);
      
      console.log(`✅ ${fileName}: Safely uploaded and verified`);
      return true;
      
    } catch (error) {
      console.error(`❌ ${fileName}: Safe upload failed - ${error.message}`);
      throw error;
    }
  }

  // Verify uploaded file integrity
  async verifyUpload(filePath, originalContent) {
    const fileName = path.basename(filePath);
    
    try {
      // Wait for GitHub to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Download and verify
      const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
        }
      });
      
      const data = await response.json();
      const downloadedContent = Buffer.from(data.content, 'base64').toString('utf-8');
      
      // Validate integrity
      if (downloadedContent !== originalContent) {
        throw new Error('Content mismatch after upload');
      }
      
      // Validate structure
      if (!this.validateFile(fileName, downloadedContent)) {
        throw new Error('Validation failed after upload');
      }
      
      console.log(`✅ ${fileName}: Upload integrity verified`);
      return true;
      
    } catch (error) {
      console.error(`❌ ${fileName}: Verification failed - ${error.message}`);
      throw error;
    }
  }

  // Batch upload with atomic operations
  async batchUpload(files) {
    console.log('🚀 Starting safe batch upload...\n');
    
    const results = [];
    
    for (const file of files) {
      try {
        if (!fs.existsSync(file.path)) {
          console.log(`⚠️  ${file.path}: File not found, skipping`);
          continue;
        }
        
        const content = fs.readFileSync(file.path, 'utf8');
        await this.safeUpload(file.path, content, file.message || `Update ${file.path}`);
        
        results.push({ file: file.path, status: 'success' });
        
      } catch (error) {
        console.error(`❌ ${file.path}: Failed - ${error.message}`);
        results.push({ file: file.path, status: 'failed', error: error.message });
      }
    }
    
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    
    console.log(`\n📊 Upload Results: ${successful.length} success, ${failed.length} failed`);
    
    return { successful, failed };
  }
}

// Export for use
export default SafeGitHubUploader;

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const uploader = new SafeGitHubUploader();
  
  // Upload critical config files safely
  const criticalFiles = CRITICAL_FILES
    .filter(file => fs.existsSync(file))
    .map(file => ({ path: file, message: `Safe update of ${file}` }));
  
  uploader.batchUpload(criticalFiles);
}