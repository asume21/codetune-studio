import { execSync } from 'child_process';
import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function pushToGitHub() {
  try {
    console.log('🚀 Pushing to GitHub using direct API...');
    
    // Get the current commit SHA
    const currentSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    console.log('Current commit SHA:', currentSha);
    
    // Get all files in the repository
    const files = execSync('git ls-tree -r --name-only HEAD', { encoding: 'utf8' })
      .split('\n')
      .filter(f => f.trim() && !f.startsWith('.git'));
    
    console.log(`Found ${files.length} files to sync`);
    
    // Create tree entries for all files
    const tree = [];
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'base64');
          tree.push({
            path: file,
            mode: '100644',
            type: 'blob',
            content: content
          });
        }
      } catch (e) {
        console.log(`Skipping ${file}:`, e.message);
      }
    }
    
    console.log(`Creating tree with ${tree.length} files...`);
    
    // Get current remote head
    const refResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const refData = await refResponse.json();
    const parentSha = refData.object.sha;
    console.log('Remote parent SHA:', parentSha);
    
    // Create tree
    const treeResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tree })
    });
    
    const treeData = await treeResponse.json();
    if (!treeResponse.ok) {
      console.error('Failed to create tree:', treeData);
      return;
    }
    
    console.log('Tree created:', treeData.sha);
    
    // Get commit message
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    console.log('Commit message:', commitMessage);
    
    // Create commit
    const commitResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [parentSha]
      })
    });
    
    const commitData = await commitResponse.json();
    if (!commitResponse.ok) {
      console.error('Failed to create commit:', commitData);
      return;
    }
    
    console.log('Commit created:', commitData.sha);
    
    // Update main branch
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: commitData.sha
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Successfully pushed to GitHub!');
      console.log('🎵 Music Mixer and all improvements are now live on GitHub!');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to update main:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

pushToGitHub();