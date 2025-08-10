import { execSync } from 'child_process';
import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const OWNER = 'asume21';
const REPO = 'codetune-studio';

async function safePushToGitHub() {
  try {
    console.log('🚀 Safely pushing to GitHub with proper file encoding...');
    
    // Get all files that should be text (not binary)
    const textFiles = execSync('git ls-tree -r --name-only HEAD', { encoding: 'utf8' })
      .split('\n')
      .filter(f => f.trim() && !f.startsWith('.git'))
      .filter(f => {
        // Only include text files, exclude binaries
        return f.match(/\.(js|ts|tsx|json|md|yaml|yml|txt|css|html|svg)$/) || 
               f === 'package.json' || f === 'tsconfig.json' || f === 'README.md';
      });
    
    console.log(`Creating tree with ${textFiles.length} text files...`);
    
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
    
    // Create blobs for each file individually to ensure proper encoding
    const treeItems = [];
    for (const file of textFiles) {
      try {
        if (fs.existsSync(file)) {
          let content;
          if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
            // For critical files, read as text and ensure proper UTF-8
            content = fs.readFileSync(file, 'utf8');
            
            // Create blob with text content
            const blobResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: content,
                encoding: 'utf-8'
              })
            });
            
            const blobData = await blobResponse.json();
            if (!blobResponse.ok) {
              console.error(`Failed to create blob for ${file}:`, blobData);
              continue;
            }
            
            treeItems.push({
              path: file,
              mode: '100644',
              type: 'blob',
              sha: blobData.sha
            });
          } else {
            // For other text files, use base64 but ensure it's handled correctly
            const content = fs.readFileSync(file, 'base64');
            treeItems.push({
              path: file,
              mode: '100644',
              type: 'blob',
              content: content
            });
          }
          
          console.log(`✓ Processed ${file}`);
        }
      } catch (e) {
        console.log(`Skipping ${file}:`, e.message);
      }
    }
    
    console.log(`Creating tree with ${treeItems.length} items...`);
    
    // Create tree
    const treeResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tree: treeItems })
    });
    
    const treeData = await treeResponse.json();
    if (!treeResponse.ok) {
      console.error('Failed to create tree:', treeData);
      return;
    }
    
    console.log('Tree created:', treeData.sha);
    
    // Create commit
    const commitResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Fix corrupted files and enable auto-deployment\n\n- Restore proper JSON encoding for package.json and other critical files\n- Enable autoDeploy in render.yaml for automatic deployments\n- Ensure Music Mixer and all improvements are properly deployed",
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
      console.log('✅ Successfully pushed to GitHub with proper file encoding!');
      console.log('🚀 Auto-deployment should now trigger on Render!');
      console.log('🎵 Your Music Mixer will be live shortly!');
    } else {
      const error = await updateResponse.json();
      console.error('❌ Failed to update main:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

safePushToGitHub();