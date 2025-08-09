#!/bin/bash

echo "🔄 Pushing CodedSwitch Studio changes to GitHub..."

# Set Git credentials
export GIT_ASKPASS_HELPER=/bin/echo
export GITHUB_TOKEN=$GITHUB_PAT

# Force push with the token in the URL
git push https://asume21:$GITHUB_PAT@github.com/asume21/codetune-studio.git main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🌟 Your Music Mixer and all improvements are now live on GitHub"
else
    echo "❌ Push failed"
fi