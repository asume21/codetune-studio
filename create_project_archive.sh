#!/bin/bash

echo "Creating CodedSwitch Studio project archive..."

# Create a temporary directory for the project
mkdir -p /tmp/codetune-studio

# Copy essential project files (excluding node_modules and cache)
cp -r client /tmp/codetune-studio/
cp -r server /tmp/codetune-studio/
cp -r shared /tmp/codetune-studio/
cp README.md /tmp/codetune-studio/
cp package.json /tmp/codetune-studio/
cp package-lock.json /tmp/codetune-studio/
cp tsconfig.json /tmp/codetune-studio/
cp vite.config.ts /tmp/codetune-studio/
cp tailwind.config.ts /tmp/codetune-studio/
cp postcss.config.js /tmp/codetune-studio/
cp components.json /tmp/codetune-studio/
cp drizzle.config.ts /tmp/codetune-studio/
cp replit.md /tmp/codetune-studio/
cp .replit /tmp/codetune-studio/
cp .gitignore /tmp/codetune-studio/

# Create the archive
cd /tmp
tar -czf codetune-studio.tar.gz codetune-studio/

echo "✓ Project archive created: /tmp/codetune-studio.tar.gz"
echo "✓ Archive contains complete CodedSwitch Studio with all features"

# Show archive contents
echo ""
echo "Archive contents:"
tar -tzf codetune-studio.tar.gz | head -20
echo "... and more"