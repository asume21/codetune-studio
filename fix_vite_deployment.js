import fs from 'fs';
import BulletproofUploader from './bulletproof_uploader.js';

async function fixViteDeployment() {
  try {
    console.log('🔧 Fixing Vite deployment by moving build tools to production dependencies...');
    
    // Read current package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Essential build tools that MUST be in dependencies for production builds
    const buildTools = [
      'vite',
      'esbuild', 
      '@vitejs/plugin-react',
      'typescript',
      'drizzle-kit',
      '@tailwindcss/vite',
      'autoprefixer',
      'postcss',
      'tailwindcss',
      'tailwindcss-animate'
    ];
    
    // Move build tools from devDependencies to dependencies
    if (!packageJson.devDependencies) packageJson.devDependencies = {};
    
    buildTools.forEach(tool => {
      if (packageJson.devDependencies[tool]) {
        packageJson.dependencies[tool] = packageJson.devDependencies[tool];
        delete packageJson.devDependencies[tool];
        console.log(`✅ Moved ${tool} to production dependencies`);
      }
    });
    
    // Sort dependencies alphabetically for cleaner output
    const sortedDeps = {};
    Object.keys(packageJson.dependencies).sort().forEach(key => {
      sortedDeps[key] = packageJson.dependencies[key];
    });
    packageJson.dependencies = sortedDeps;
    
    // Write the fixed package.json locally
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('💾 Updated local package.json');
    
    // Upload safely using bulletproof uploader
    const uploader = new BulletproofUploader();
    await uploader.bulletproofUpload('package.json', 'FIX: Move Vite and build tools to production dependencies for Render deployment');
    
    console.log('🚀 Deployment fix complete! Render should now find Vite during build.');
    console.log('📝 Build command will now work: vite build && esbuild server/index.ts...');
    
  } catch (error) {
    console.error('❌ Failed to fix deployment:', error.message);
  }
}

fixViteDeployment();