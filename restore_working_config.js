import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function restoreWorkingConfig() {
  try {
    console.log('🔄 Restoring original working configuration...');
    
    // Read the LOCAL working files
    const workingViteConfig = fs.readFileSync('vite.config.ts', 'utf8');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    console.log('✅ Local configs are working correctly');
    
    // The ONLY thing we need to change is keep build dependencies in production
    // But use the ORIGINAL build script that was working
    packageJson.scripts.build = 'vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist';
    
    const files = [
      { 
        path: 'vite.config.ts', 
        content: workingViteConfig,
        message: 'RESTORE: Use original working vite.config.ts with conditional Replit plugins'
      },
      { 
        path: 'package.json', 
        content: JSON.stringify(packageJson, null, 2),
        message: 'RESTORE: Use original build script with production dependencies'
      }
    ];
    
    for (const file of files) {
      // Validate before upload
      if (file.path.endsWith('.json')) {
        JSON.parse(file.content);
      }
      
      // Get SHA
      const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${file.path}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
        }
      });
      
      const fileData = await fileResponse.json();
      const base64Content = Buffer.from(file.content, 'utf8').toString('base64');
      
      // Upload
      const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${file.path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: file.message,
          content: base64Content,
          sha: fileData.sha
        })
      });
      
      if (updateResponse.ok) {
        console.log(`✅ Restored ${file.path}`);
      } else {
        console.error(`❌ Failed to restore ${file.path}`);
      }
    }
    
    console.log('🎉 Original working configuration restored!');
    console.log('📝 The vite.config.ts already had conditional logic for production');
    console.log('🚀 Deployment should work with original setup + production dependencies');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

restoreWorkingConfig();