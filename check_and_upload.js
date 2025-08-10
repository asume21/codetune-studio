import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function checkAndUpload() {
  try {
    // Check if file exists
    const checkResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/vite.config.prod.ts`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const viteConfig = fs.readFileSync('vite.config.prod.ts', 'utf8');
    const viteConfigContent = Buffer.from(viteConfig).toString('base64');
    
    let uploadBody;
    if (checkResponse.ok) {
      // File exists, need SHA
      const existingFile = await checkResponse.json();
      uploadBody = {
        message: "Update production vite config without Replit plugins",
        content: viteConfigContent,
        sha: existingFile.sha
      };
    } else {
      // File doesn't exist, create new
      uploadBody = {
        message: "Add production vite config without Replit plugins", 
        content: viteConfigContent
      };
    }
    
    const uploadResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/vite.config.prod.ts`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadBody)
    });
    
    if (uploadResponse.ok) {
      console.log('✅ Uploaded production vite config');
      
      // Update package.json build command
      const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
        }
      });
      
      const fileData = await fileResponse.json();
      const packageJson = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
      
      packageJson.scripts.build = "npx vite build --config vite.config.prod.ts && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist";
      
      const content = Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64');
      
      const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "Use production vite config for deployment build",
          content: content,
          sha: fileData.sha
        })
      });

      if (updateResponse.ok) {
        console.log('✅ Updated build command for production deployment');
      } else {
        const error = await updateResponse.json();
        console.error('Failed to update package.json:', error);
      }
      
    } else {
      const error = await uploadResponse.json();
      console.error('Failed to upload vite config:', error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndUpload();