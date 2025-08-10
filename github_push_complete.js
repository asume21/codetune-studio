import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function pushCompletePackageJson() {
  try {
    // Read the complete local package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Update build command to use npx and correct config
    packageJson.scripts.build = "npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist";
    
    // Ensure vite and esbuild are in devDependencies
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    packageJson.devDependencies.vite = "^5.4.11";
    packageJson.devDependencies.esbuild = "^0.24.2";
    
    // Convert to base64
    const content = Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64');
    
    // Get current file SHA
    const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const fileData = await fileResponse.json();
    
    // Update file with complete package.json
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Deploy complete package.json with all dependencies and correct build command",
        content: content,
        sha: fileData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Pushed complete package.json with all dependencies');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to update package.json:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

pushCompletePackageJson();