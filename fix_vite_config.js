import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function fixViteConfig() {
  try {
    console.log('🔧 Fixing corrupted vite.config.ts...');
    
    // Read the local vite.config.ts
    const localContent = fs.readFileSync('vite.config.ts', 'utf8');
    console.log('✅ Local vite.config.ts is valid TypeScript');
    
    // Get current SHA from GitHub
    const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/vite.config.ts`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const fileData = await fileResponse.json();
    
    // Upload clean version with proper encoding
    const base64Content = Buffer.from(localContent, 'utf8').toString('base64');
    
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/vite.config.ts`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'CRITICAL FIX: Restore corrupted vite.config.ts from clean local version',
        content: base64Content,
        sha: fileData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Fixed vite.config.ts corruption on GitHub');
      console.log('🚀 Render deployment should now work');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to fix vite.config.ts:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixViteConfig();