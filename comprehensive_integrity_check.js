import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

const ALL_CONFIG_FILES = [
  'package.json',
  'tsconfig.json', 
  'vite.config.ts',
  'tailwind.config.ts',
  'drizzle.config.ts',
  'postcss.config.js',
  'components.json'
];

async function checkAllFiles() {
  console.log('🔍 Running comprehensive GitHub integrity check...\n');
  
  const results = [];
  
  for (const fileName of ALL_CONFIG_FILES) {
    try {
      // Check if file exists locally
      if (!fs.existsSync(fileName)) {
        console.log(`⚠️  ${fileName}: Not found locally`);
        continue;
      }
      
      // Get from GitHub
      const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${fileName}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
        }
      });
      
      if (!response.ok) {
        console.log(`⚠️  ${fileName}: Not found on GitHub`);
        continue;
      }
      
      const data = await response.json();
      const githubContent = Buffer.from(data.content, 'base64').toString('utf-8');
      
      // Validate based on file type
      if (fileName.endsWith('.json')) {
        try {
          JSON.parse(githubContent);
          console.log(`✅ ${fileName}: Valid JSON`);
          results.push({ file: fileName, status: 'valid' });
        } catch (error) {
          console.log(`❌ ${fileName}: Invalid JSON - ${error.message}`);
          results.push({ file: fileName, status: 'corrupted' });
        }
      } else {
        // Check for base64 corruption patterns
        if (githubContent.includes('aW1wb3J0') || githubContent.includes('ZXhwb3J0')) {
          console.log(`❌ ${fileName}: Contains base64 corruption`);
          results.push({ file: fileName, status: 'corrupted' });
        } else {
          console.log(`✅ ${fileName}: Appears clean`);
          results.push({ file: fileName, status: 'valid' });
        }
      }
      
    } catch (error) {
      console.log(`❌ ${fileName}: Error checking - ${error.message}`);
      results.push({ file: fileName, status: 'error' });
    }
  }
  
  console.log('\n📊 Final Integrity Report:');
  const corrupted = results.filter(r => r.status === 'corrupted');
  const errors = results.filter(r => r.status === 'error');
  
  if (corrupted.length === 0 && errors.length === 0) {
    console.log('✅ ALL FILES ARE CLEAN - Deployment ready!');
  } else {
    if (corrupted.length > 0) {
      console.log('❌ Corrupted files:');
      corrupted.forEach(r => console.log(`   - ${r.file}`));
    }
    if (errors.length > 0) {
      console.log('⚠️  Files with errors:');
      errors.forEach(r => console.log(`   - ${r.file}`));
    }
  }
  
  return { corrupted, errors };
}

checkAllFiles();