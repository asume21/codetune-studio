# CodedSwitch Deployment Best Practices

## Build Protection Strategy

### 1. **Critical Files to Never Modify**
- `package.json` - Contains production build configuration
- `vite.config.prod.ts` - Production build settings
- `server/index.prod.ts` - Production server configuration  
- `render.yaml` - Deployment configuration

### 2. **Safe Development Workflow**

#### Before Making Changes:
1. **Create a backup of working state**
   ```bash
   git add -A
   git commit -m "Working state backup before changes"
   git tag "working-build-$(date +%Y%m%d-%H%M)"
   ```

2. **Test locally first**
   ```bash
   npm run build    # Test production build
   npm start        # Test production server
   ```

3. **Verify key files are intact**
   - Check package.json references `.ts` not `.js`
   - Verify vite.config.prod.ts has correct paths
   - Confirm server/index.prod.ts exists

#### Making Safe Changes:
1. **Only modify development files**
   - `client/src/*` (your React components)
   - `server/routes.ts` (API endpoints)
   - `server/services/*` (business logic)
   - `shared/schema.ts` (data models)

2. **Avoid touching production configs**
   - Never edit `package.json` directly
   - Don't modify `vite.config.prod.ts`
   - Keep `server/index.prod.ts` unchanged

3. **Test incrementally**
   ```bash
   npm run dev      # Test development mode
   npm run build    # Test production build
   ```

### 3. **GitHub Push Best Practices**

#### Safe Push Process:
1. **Verify local build works**
   ```bash
   npm run build && npm start
   ```

2. **Check file integrity**
   ```bash
   grep '"build"' package.json  # Should reference .ts not .js
   ls -la vite.config.prod.ts server/index.prod.ts render.yaml
   ```

3. **Push only changed source files**
   - Avoid pushing config files unless specifically needed
   - Focus on `client/src/`, `server/routes.ts`, `server/services/`

4. **Use descriptive commit messages**
   ```bash
   git add client/src/components/NewFeature.tsx
   git commit -m "Add new music feature: [specific functionality]"
   git push origin main
   ```

### 4. **Recovery Plan**

If deployment breaks:

1. **Revert to last working commit**
   ```bash
   git reset --hard [working-commit-hash]
   git push --force origin main
   ```

2. **Restore from working tag**
   ```bash
   git checkout working-build-[date]
   git push --force origin main
   ```

3. **Emergency file restoration**
   - Download correct files from GitHub if local is corrupted
   - Use curl to restore from raw GitHub URLs

### 5. **File Monitoring**

Watch these critical file checksums:
- `package.json` build command: `"npx vite build --config vite.config.prod.ts"`
- `vite.config.prod.ts` outDir: `"../dist/client"`
- `render.yaml` buildCommand: `npm install && npm run build`

### 6. **Environment Protection**

- Keep `XAI_API_KEY` in Render environment variables
- Never commit API keys to repository
- Use environment-specific configs only

## Quick Verification Commands

```bash
# Check if build config is correct
grep '"build"' package.json | grep "vite.config.prod.ts"

# Verify production files exist
ls -la vite.config.prod.ts server/index.prod.ts render.yaml

# Test full build pipeline
npm run build && echo "Build successful!"
```

## Emergency Contacts
- Current working GitHub commit: [Latest successful build]
- Known good configuration files backed up in repository
- Render deployment logs for troubleshooting