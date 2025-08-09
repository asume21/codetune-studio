import fs from 'fs';
import { execSync } from 'child_process';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function pushToGitHub() {
  try {
    console.log('🚀 Pushing changes to GitHub using API...');
    
    // Get the latest commit SHA from local
    const latestCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    console.log('Latest local commit:', latestCommit);
    
    // Get current branch ref
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    const refData = await response.json();
    console.log('Current remote SHA:', refData.object.sha);
    
    // Update the reference to point to our latest commit
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: latestCommit,
        force: true
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Successfully pushed commits to GitHub!');
      console.log('🎵 Your Music Mixer and all improvements are now live!');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to push:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

pushToGitHub();