import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

const CORRUPTED_FILES = [
  'tailwind.config.ts',
  'drizzle.config.ts', 
  'postcss.config.js',
  'components.json'
];

async function fixCorruptedFile(fileName) {
  try {
    if (!fs.existsSync(fileName)) {
      console.log(`⚠️  ${fileName} not found locally`);
      return false;
    }
    
    const localContent = fs.readFileSync(fileName, 'utf8');
    
    // Validate JSON files
    if (fileName.endsWith('.json')) {
      JSON.parse(localContent);
    }
    
    // Get current SHA
    const fileResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const fileData = await fileResponse.json();
    const base64Content = Buffer.from(localContent, 'utf8').toString('base64');
    
    // Upload clean version
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `CORRUPTION FIX: Restore clean ${fileName}`,
        content: base64Content,
        sha: fileData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log(`✅ Fixed ${fileName}`);
      return true;
    } else {
      console.log(`❌ Failed to fix ${fileName}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error fixing ${fileName}: ${error.message}`);
    return false;
  }
}

async function fixAllCorrupted() {
  console.log('🔧 Fixing all corrupted config files...\n');
  
  let fixedCount = 0;
  
  for (const file of CORRUPTED_FILES) {
    const success = await fixCorruptedFile(file);
    if (success) fixedCount++;
  }
  
  console.log(`\n✅ Fixed ${fixedCount}/${CORRUPTED_FILES.length} corrupted files`);
  
  if (fixedCount === CORRUPTED_FILES.length) {
    console.log('🚀 All corruption issues resolved - deployment ready!');
  }
}

fixAllCorrupted();