#!/bin/bash

# GitHub repository details
OWNER="asume21"
REPO="codetune-studio"
BRANCH="main"

# Function to upload a file to GitHub
upload_file() {
    local file_path="$1"
    local github_path="$2"
    
    if [ -f "$file_path" ]; then
        echo "Uploading $file_path to $github_path..."
        
        # Encode file content to base64
        content=$(base64 -w 0 "$file_path")
        
        # Create the JSON payload
        json_payload=$(cat <<EOF
{
  "message": "Add $github_path",
  "content": "$content",
  "branch": "$BRANCH"
}
EOF
)
        
        # Upload to GitHub
        curl -s -X PUT \
            -H "Authorization: token $GITHUB_PAT" \
            -H "Content-Type: application/json" \
            -d "$json_payload" \
            "https://api.github.com/repos/$OWNER/$REPO/contents/$github_path"
        
        echo "✓ Uploaded $github_path"
    else
        echo "❌ File not found: $file_path"
    fi
}

# Upload key project files
echo "Starting CodedSwitch Studio upload to GitHub..."

# Root files
upload_file "README.md" "README.md"
upload_file "package.json" "package.json"
upload_file "tsconfig.json" "tsconfig.json"
upload_file "vite.config.ts" "vite.config.ts"
upload_file "tailwind.config.ts" "tailwind.config.ts"
upload_file "postcss.config.js" "postcss.config.js"
upload_file "components.json" "components.json"
upload_file "drizzle.config.ts" "drizzle.config.ts"
upload_file "replit.md" "replit.md"

echo "CodedSwitch Studio upload completed!"