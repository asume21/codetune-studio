import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function fixDeployment() {
  try {
    console.log('🔧 Creating production package.json for deployment...');
    
    // Read current package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Move build dependencies from devDependencies to dependencies
    const buildDeps = {
      'vite': packageJson.devDependencies.vite,
      'esbuild': packageJson.devDependencies.esbuild,
      '@vitejs/plugin-react': packageJson.devDependencies['@vitejs/plugin-react'],
      'typescript': packageJson.devDependencies.typescript,
      'tailwindcss': packageJson.devDependencies.tailwindcss,
      'postcss': packageJson.devDependencies.postcss,
      'autoprefixer': packageJson.devDependencies.autoprefixer
    };
    
    // Create production package.json
    const prodPackage = {
      ...packageJson,
      dependencies: {
        ...packageJson.dependencies,
        ...buildDeps
      }
    };
    
    // Convert to base64
    const base64Content = Buffer.from(JSON.stringify(prodPackage, null, 2)).toString('base64');
    
    // Get current file SHA
    const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const fileData = await fileResponse.json();
    
    // Update package.json on GitHub
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Fix production build dependencies for Render deployment',
        content: base64Content,
        sha: fileData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Updated package.json with build dependencies!');
      console.log('🚀 Render deployment should now work');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to update package.json:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixDeployment();