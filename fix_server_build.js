const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function fixServerBuild() {
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
    
    // Update build command to use production server file
    packageJson.scripts.build = "npx vite build --config vite.config.prod.ts && npx esbuild server/index.prod.ts --platform=node --packages=external --bundle --format=esm --outdir=dist";
    
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
        message: "Fix server build to use production index.prod.ts without Replit imports",
        content: content,
        sha: fileData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Fixed server build command to use index.prod.ts');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to update package.json:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixServerBuild();