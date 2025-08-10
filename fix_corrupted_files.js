import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function fixCorruptedFile(fileName) {
  try {
    if (!fs.existsSync(fileName)) {
      console.log(`⚠️  ${fileName} not found locally, skipping`);
      return false;
    }
    
    // Read local file
    const localContent = fs.readFileSync(fileName, 'utf8');
    
    // Validate if it's JSON
    if (fileName.endsWith('.json')) {
      JSON.parse(localContent); // Validate
    }
    
    // Get current SHA from GitHub
    const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const fileData = await fileResponse.json();
    
    // Upload clean version
    const base64Content = Buffer.from(localContent, 'utf8').toString('base64');
    
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Fix corrupted ${fileName} - restore from clean local version`,
        content: base64Content,
        sha: fileData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log(`✅ Fixed ${fileName} on GitHub`);
      return true;
    } else {
      const error = await updateResponse.json();
      console.error(`❌ Failed to fix ${fileName}:`, error.message);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${fileName}:`, error.message);
    return false;
  }
}

async function fixAllCorrupted() {
  console.log('🔧 Fixing corrupted files on GitHub...\n');
  
  const filesToFix = ['tsconfig.json'];
  
  for (const file of filesToFix) {
    await fixCorruptedFile(file);
  }
  
  console.log('\n✅ File corruption fixes completed');
}

fixAllCorrupted();