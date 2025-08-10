import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function fixProductionBuild() {
  try {
    console.log('🔧 Creating production build configuration...');
    
    // Read local package.json to update build script
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Update build script to use production vite config
    packageJson.scripts.build = 'vite build --config vite.config.prod.ts && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist';
    
    const packageContent = JSON.stringify(packageJson, null, 2);
    
    // Read production vite config
    const viteConfigContent = fs.readFileSync('vite.config.prod.ts', 'utf8');
    
    // Upload both files safely
    const filesToUpload = [
      { path: 'package.json', content: packageContent },
      { path: 'vite.config.prod.ts', content: viteConfigContent }
    ];
    
    for (const file of filesToUpload) {
      // Get current SHA
      const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${file.path}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
        }
      });
      
      let sha = null;
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        sha = fileData.sha;
      }
      
      // Validate content
      if (file.path.endsWith('.json')) {
        JSON.parse(file.content); // Validate JSON
      }
      
      const base64Content = Buffer.from(file.content, 'utf8').toString('base64');
      
      // Upload
      const payload = {
        message: `PRODUCTION FIX: Update ${file.path} for deployment compatibility`,
        content: base64Content
      };
      
      if (sha) payload.sha = sha;
      
      const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${file.path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (updateResponse.ok) {
        console.log(`✅ Updated ${file.path} for production`);
      } else {
        const error = await updateResponse.json();
        console.error(`❌ Failed to update ${file.path}:`, error.message);
      }
    }
    
    console.log('🚀 Production build configuration ready!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixProductionBuild();