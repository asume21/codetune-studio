# Deployment Guide for CodedSwitch Studio

## Deploy to Render

CodedSwitch Studio is configured for easy deployment on Render. Follow these steps:

### 1. Prerequisites
- GitHub repository with your code (already set up at: https://github.com/asume21/codetune-studio)
- Render account (free tier available)
- xAI API key for AI-powered music generation
- PostgreSQL database (Render provides free PostgreSQL)

### 2. Database Setup
1. In your Render dashboard, create a new PostgreSQL database
2. Copy the External Database URL for use in step 4

### 3. Deploy the Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository: `https://github.com/asume21/codetune-studio`
4. Configure the service:
   - **Name**: `codetune-studio`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free tier is sufficient for testing

### 4. Environment Variables
Add these environment variables in Render:

```
NODE_ENV=production
XAI_API_KEY=your_xai_api_key_here
DATABASE_URL=your_postgresql_url_from_step_2
```

### 5. Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Your studio will be available at: `https://your-service-name.onrender.com`

## Build Process
The application uses a two-stage build:
1. **Client Build**: React/TypeScript frontend compiled with Vite
2. **Server Build**: Express.js backend bundled with esbuild

## Production Features
- Optimized static asset serving
- Proper error handling and logging
- Environment-based configuration
- Database connection pooling
- Gzip compression for faster loading

## Troubleshooting

### Build Failures
- Ensure all environment variables are set correctly
- Check that your xAI API key is valid
- Verify the DATABASE_URL format is correct

### Runtime Issues
- Check the Render logs in your dashboard
- Ensure the PostgreSQL database is accessible
- Verify the PORT environment variable is set by Render

### Performance
- Free tier has some limitations (sleeps after 15 minutes of inactivity)
- Consider upgrading to paid tier for production use
- Monitor memory usage in Render dashboard

## Local Development
To run locally after cloning:

```bash
npm install
cp .env.example .env
# Add your API keys to .env
npm run dev
```

## Features Available in Production
- AI-powered multi-track orchestral composition
- MIDI controller support for hardware input
- Realistic instrument sounds via General MIDI
- Professional beat maker and melody composer
- Code translation and security scanning
- Real-time audio synthesis and processing

Your CodedSwitch Studio will be fully functional on Render with all features working as designed!