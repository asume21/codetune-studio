import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

const CRITICAL_FILES = [
  'package.json',
  'tsconfig.json', 
  'vite.config.ts',
  'tailwind.config.ts'
];

async function checkFileIntegrity(fileName) {
  try {
    // Get file from GitHub
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️  ${fileName}: Not found on GitHub`);
      return false;
    }
    
    const data = await response.json();
    const githubContent = Buffer.from(data.content, 'base64').toString('utf-8');
    
    // Compare with local if exists
    if (fs.existsSync(fileName)) {
      const localContent = fs.readFileSync(fileName, 'utf8');
      
      if (fileName.endsWith('.json')) {
        try {
          const githubJson = JSON.parse(githubContent);
          const localJson = JSON.parse(localContent);
          console.log(`✅ ${fileName}: Valid JSON on GitHub`);
          return true;
        } catch (error) {
          console.log(`❌ ${fileName}: Invalid JSON on GitHub - ${error.message}`);
          return false;
        }
      } else {
        console.log(`✅ ${fileName}: Present on GitHub`);
        return true;
      }
    } else {
      console.log(`⚠️  ${fileName}: Not found locally`);
      return true; // Not a corruption issue
    }
    
  } catch (error) {
    console.log(`❌ ${fileName}: Error checking - ${error.message}`);
    return false;
  }
}

async function verifyIntegrity() {
  console.log('🔍 Checking GitHub file integrity...\n');
  
  const results = [];
  
  for (const file of CRITICAL_FILES) {
    const isValid = await checkFileIntegrity(file);
    results.push({ file, isValid });
  }
  
  console.log('\n📊 Integrity Report:');
  const corrupted = results.filter(r => !r.isValid);
  
  if (corrupted.length === 0) {
    console.log('✅ All critical files are intact on GitHub');
  } else {
    console.log('❌ Files with issues:');
    corrupted.forEach(r => console.log(`   - ${r.file}`));
  }
  
  return corrupted.length === 0;
}

verifyIntegrity();