const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function verifyFiles() {
  try {
    // Check package.json
    const packageResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
    });
    const packageData = await packageResponse.json();
    const packageJson = JSON.parse(Buffer.from(packageData.content, 'base64').toString());
    
    console.log('📦 PACKAGE.JSON STATUS:');
    console.log('  Dependencies:', Object.keys(packageJson.dependencies || {}).length);
    console.log('  Has React:', packageJson.dependencies?.react ? '✅' : '❌');
    console.log('  Has Express:', packageJson.dependencies?.express ? '✅' : '❌'); 
    console.log('  Has Vite:', packageJson.dependencies?.vite ? '✅' : '❌');
    console.log('  Build command:', packageJson.scripts?.build);
    console.log('');
    
    // Check if main files exist
    const filesToCheck = [
      'client/src/App.tsx',
      'client/src/components/studio/MusicMixer.tsx',
      'server/index.ts',
      'vite.config.prod.ts'
    ];
    
    for (const file of filesToCheck) {
      try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${file}`, {
          headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
        });
        console.log(`📄 ${file}:`, response.ok ? '✅ EXISTS' : '❌ MISSING');
      } catch (error) {
        console.log(`📄 ${file}: ❌ ERROR`);
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyFiles();