import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function fixProductionDeps() {
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
    
    // Move vite and esbuild from devDependencies to dependencies
    packageJson.dependencies.vite = "^5.4.11";
    packageJson.dependencies.esbuild = "^0.24.2";
    packageJson.dependencies.tsx = "^4.19.2";
    
    // Remove from devDependencies if they exist there
    if (packageJson.devDependencies) {
      delete packageJson.devDependencies.vite;
      delete packageJson.devDependencies.esbuild;
    }
    
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
        message: "Move vite and esbuild to production dependencies for Render deployment",
        content: content,
        sha: fileData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Moved vite and esbuild to production dependencies');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to update package.json:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixProductionDeps();