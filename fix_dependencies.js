import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function fixDependencies() {
  try {
    // Get current package.json from GitHub
    const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const fileData = await fileResponse.json();
    const packageJson = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
    
    // Ensure vite and esbuild are in devDependencies
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    
    packageJson.devDependencies.vite = "^5.4.11";
    packageJson.devDependencies.esbuild = "^0.24.2";
    
    // Convert to base64
    const content = Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64');
    
    // Update file
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Add vite and esbuild as devDependencies for deployment",
        content: content,
        sha: fileData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Added vite and esbuild as devDependencies');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to update package.json:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixDependencies();