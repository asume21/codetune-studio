const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function checkGitHub() {
  try {
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString();
    const packageJson = JSON.parse(content);
    
    console.log('GitHub package.json status:');
    console.log('- Dependencies count:', Object.keys(packageJson.dependencies || {}).length);
    console.log('- DevDependencies count:', Object.keys(packageJson.devDependencies || {}).length);
    console.log('- Build command:', packageJson.scripts?.build || 'missing');
    console.log('- Has React?', packageJson.dependencies?.react ? 'YES' : 'NO');
    console.log('- Has Express?', packageJson.dependencies?.express ? 'YES' : 'NO');
    console.log('- Has Vite in dev?', packageJson.devDependencies?.vite ? 'YES' : 'NO');
    
  } catch (error) {
    console.error('Error checking GitHub:', error.message);
  }
}

checkGitHub();