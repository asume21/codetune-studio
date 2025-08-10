import fs from 'fs';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

// Helper function to commit and push a single file
async function commitFile(filePath, commitMessage) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const base64Content = Buffer.from(content).toString('base64');
    
    // Get current file SHA if it exists
    let sha = null;
    try {
      const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
        headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
      });
      if (response.ok) {
        const data = await response.json();
        sha = data.sha;
      }
    } catch (error) {
      // File doesn't exist, that's ok
    }
    
    const updateData = {
      message: commitMessage,
      content: base64Content
    };
    
    if (sha) {
      updateData.sha = sha;
    }
    
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    if (response.ok) {
      console.log(`✅ Committed: ${filePath}`);
      return true;
    } else {
      const error = await response.json();
      console.error(`❌ Failed to commit ${filePath}:`, error.message);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error committing ${filePath}:`, error.message);
    return false;
  }
}

// Main function to commit multiple files
async function commitChanges(files, message) {
  console.log(`🚀 Committing ${files.length} files to GitHub...`);
  
  const results = await Promise.all(
    files.map(file => commitFile(file, message))
  );
  
  const successful = results.filter(r => r).length;
  console.log(`✅ Successfully committed ${successful}/${files.length} files`);
  
  return successful === files.length;
}

// Export for use
export { commitFile, commitChanges };

// If run directly, commit all modified files
if (import.meta.url === `file://${process.argv[1]}`) {
  const message = process.argv[2] || "Update files";
  const files = process.argv.slice(3);
  
  if (files.length === 0) {
    console.log("Usage: node github_commit_helper.js 'commit message' file1.js file2.ts ...");
    process.exit(1);
  }
  
  commitChanges(files, message);
}