import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function fixPackageJson() {
  try {
    console.log('🔧 Fixing package.json corruption on GitHub...');
    
    // Read the local package.json
    const packageContent = fs.readFileSync('package.json', 'utf8');
    const base64Content = Buffer.from(packageContent).toString('base64');
    
    // Get current file SHA from GitHub
    const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const fileData = await fileResponse.json();
    
    // Update the file
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/package.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Fix package.json corruption for Render deployment',
        content: base64Content,
        sha: fileData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Fixed package.json on GitHub!');
      console.log('🚀 Render deployment should now work');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to fix package.json:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixPackageJson();