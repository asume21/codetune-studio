import { execSync } from 'child_process';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function pushCommitsToGitHub() {
  try {
    console.log('🚀 Creating commits directly on GitHub...');
    
    // Get all unpushed commits
    const commits = execSync('git log --format="%H|%P|%s" origin/main..HEAD', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(line => line)
      .reverse(); // Process in chronological order
    
    if (commits.length === 0) {
      console.log('No new commits to push');
      return;
    }
    
    console.log(`Found ${commits.length} commits to push`);
    
    // Get current remote head
    const refResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      }
    });
    
    let parentSha = (await refResponse.json()).object.sha;
    console.log('Starting from parent SHA:', parentSha);
    
    for (const commitLine of commits) {
      const [sha, parents, message] = commitLine.split('|');
      console.log(`Processing commit: ${sha.substring(0, 8)} - ${message}`);
      
      // Get commit details
      const commitData = execSync(`git show --format="%an|%ae|%ad|%cn|%ce|%cd" --name-only ${sha}`, { encoding: 'utf8' });
      const lines = commitData.split('\n');
      const [authorName, authorEmail, authorDate, committerName, committerEmail, committerDate] = lines[0].split('|');
      const changedFiles = lines.slice(2).filter(f => f.trim());
      
      // Create tree
      const tree = [];
      for (const file of changedFiles) {
        try {
          const content = execSync(`git show ${sha}:${file}`, { encoding: 'base64' });
          tree.push({
            path: file,
            mode: '100644',
            type: 'blob',
            content: content
          });
        } catch (e) {
          // File might be deleted
          console.log(`Skipping ${file} (possibly deleted)`);
        }
      }
      
      if (tree.length === 0) continue;
      
      // Create tree object
      const treeResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tree: tree,
          base_tree: parentSha
        })
      });
      
      const treeData = await treeResponse.json();
      if (!treeResponse.ok) {
        console.error('Failed to create tree:', treeData);
        continue;
      }
      
      // Create commit
      const commitResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          tree: treeData.sha,
          parents: [parentSha],
          author: {
            name: authorName,
            email: authorEmail,
            date: authorDate
          },
          committer: {
            name: committerName,
            email: committerEmail,
            date: committerDate
          }
        })
      });
      
      const commitResponseData = await commitResponse.json();
      if (!commitResponse.ok) {
        console.error('Failed to create commit:', commitResponseData);
        continue;
      }
      
      parentSha = commitResponseData.sha;
      console.log(`✅ Created commit: ${parentSha.substring(0, 8)}`);
    }
    
    // Update main branch reference
    const updateResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: parentSha
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Successfully pushed all commits to GitHub!');
      console.log('🎵 Your Music Mixer and all improvements are now live!');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to update main branch:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

pushCommitsToGitHub();