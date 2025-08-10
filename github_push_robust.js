import fs from 'fs';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

// Files that need special handling to avoid corruption
const CRITICAL_FILES = ['package.json', 'tsconfig.json', 'vite.config.ts'];

async function getFileSha(filePath) {
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
    return null;
  }
}

async function uploadFile(filePath, content, message) {
  try {
    const sha = await getFileSha(filePath);
    
    // Ensure clean base64 encoding for critical files
    let base64Content;
    if (CRITICAL_FILES.includes(path.basename(filePath))) {
      // Extra validation for JSON files
      if (filePath.endsWith('.json')) {
        JSON.parse(content); // Validate JSON syntax
      }
      base64Content = Buffer.from(content, 'utf8').toString('base64');
    } else {
      base64Content = Buffer.from(content).toString('base64');
    }
    
    const body = {
      message,
      content: base64Content
    };
    
    if (sha) {
      body.sha = sha;
    }
    
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      console.log(`✅ ${filePath} uploaded successfully`);
      return true;
    } else {
      const error = await response.json();
      console.error(`❌ Failed to upload ${filePath}:`, error.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error uploading ${filePath}:`, error.message);
    return false;
  }
}

async function robustPush() {
  console.log('🚀 Starting robust GitHub push...');
  
  // Verify package.json integrity first
  try {
    const packageContent = fs.readFileSync('package.json', 'utf8');
    const packageJson = JSON.parse(packageContent);
    console.log('✅ Local package.json is valid');
    
    // Upload package.json with extra care
    const success = await uploadFile('package.json', packageContent, 'Fix: Ensure package.json integrity for deployment');
    
    if (success) {
      console.log('🎉 Robust push completed successfully!');
      console.log('🚀 Render deployment should now work correctly');
    }
    
  } catch (error) {
    console.error('❌ Package.json validation failed:', error.message);
  }
}

robustPush();