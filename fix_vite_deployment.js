import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function fixViteDeployment() {
  try {
    console.log('🔧 Creating deployment-ready package.json...');
    
    // Read local package.json
    const localPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Create deployment version with ALL build tools in dependencies
    const deployPackage = {
      ...localPackage,
      dependencies: {
        ...localPackage.dependencies,
        // Move ALL build-related packages to dependencies
        "vite": "^5.4.19",
        "esbuild": "^0.25.0",
        "@vitejs/plugin-react": "^4.3.2",
        "typescript": "5.6.3",
        "tailwindcss": "^3.4.17",
        "postcss": "^8.4.47",
        "autoprefixer": "^10.4.20",
        "tsx": "^4.19.1"
      },
      // Keep devDependencies clean
      devDependencies: {
        "@replit/vite-plugin-cartographer": "^0.2.8",
        "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
        "@tailwindcss/typography": "^0.5.15",
        "@tailwindcss/vite": "^4.1.3",
        "@types/connect-pg-simple": "^7.0.3",
        "@types/express": "4.17.21",
        "@types/express-session": "^1.18.0",
        "@types/node": "20.16.11",
        "@types/passport": "^1.0.16",
        "@types/passport-local": "^1.0.38",
        "@types/react": "^18.3.11",
        "@types/react-dom": "^18.3.1",
        "@types/ws": "^8.5.13",
        "drizzle-kit": "^0.30.4"
      }
    };
    
    // Validate the JSON
    const jsonString = JSON.stringify(deployPackage, null, 2);
    JSON.parse(jsonString); // Validate
    
    console.log('✅ Created valid deployment package.json');
    
    // Get current SHA
    const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const fileData = await fileResponse.json();
    const base64Content = Buffer.from(jsonString, 'utf8').toString('base64');
    
    // Upload with corruption-proof encoding
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'DEPLOYMENT FIX: Move vite and build tools to dependencies for Render',
        content: base64Content,
        sha: fileData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Successfully uploaded deployment-ready package.json');
      console.log('🚀 Vite will now be available during Render build');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Upload failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixViteDeployment();