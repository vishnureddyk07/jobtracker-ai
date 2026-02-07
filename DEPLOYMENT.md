# JobTracker Deployment Guide

## Prerequisites
- GitHub account
- Render account (free tier available at https://render.com)
- MongoDB Atlas account (free tier at https://mongodb.com/cloud/atlas)
- OpenAI API key (https://platform.openai.com)
- Adzuna API credentials (https://developer.adzuna.com)

---

## Option 1: Deploy to Render (Recommended - Free Tier)

### Step 1: Prepare Repository

1. **Initialize Git** (if not already done):
```bash
cd "c:\Users\vishnu reddy\OneDrive\Desktop\jobtracker"
git init
git add .
git commit -m "Initial commit"
```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository named `jobtracker`
   - Don't initialize with README (already have one)

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/jobtracker.git
git branch -M main
git push -u origin main
```

### Step 2: Set Up MongoDB Atlas

1. Go to https://mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for Render access
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/jobtracker`

### Step 3: Deploy Backend to Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `jobtracker-api`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobtracker
   OPENAI_API_KEY=sk-...your-key
   ADZUNA_APP_ID=your-app-id
   ADZUNA_APP_KEY=your-app-key
   ```

6. Click **"Create Web Service"**
7. Note your API URL: `https://jobtracker-api.onrender.com`

### Step 4: Deploy Frontend to Render

1. Update frontend API configuration:
   - Open `frontend/src/services/api.js`
   - Change `API_BASE_URL` to your Render backend URL

2. Commit changes:
```bash
git add .
git commit -m "Update API URL for production"
git push
```

3. In Render Dashboard:
   - Click **"New +"** → **"Static Site"**
   - Select same repository
   - Configure:
     - **Name**: `jobtracker-frontend`
     - **Build Command**: `cd frontend && npm install && npm run build`
     - **Publish Directory**: `frontend/dist`
   - Add Environment Variable:
     ```
     VITE_API_URL=https://jobtracker-api.onrender.com
     ```

4. Click **"Create Static Site"**
5. Your app will be live at: `https://jobtracker-frontend.onrender.com`

---

## Option 2: Deploy to Vercel (Alternative)

### Backend (Vercel Serverless)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Create `vercel.json` in root:
```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "server.js" }
  ],
  "env": {
    "MONGODB_URI": "@mongodb-uri",
    "OPENAI_API_KEY": "@openai-key",
    "ADZUNA_APP_ID": "@adzuna-app-id",
    "ADZUNA_APP_KEY": "@adzuna-app-key"
  }
}
```

3. Deploy:
```bash
vercel
```

### Frontend (Vercel)

1. Navigate to frontend:
```bash
cd frontend
```

2. Deploy:
```bash
vercel
```

3. Set environment variable in Vercel dashboard:
   - `VITE_API_URL` = your backend URL

---

## Option 3: Deploy to Railway

### Quick Deploy

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect repository
5. Railway auto-detects Node.js
6. Add environment variables in dashboard
7. Get deployment URL

---

## Post-Deployment Checklist

- [ ] Test user registration/login
- [ ] Upload sample resume
- [ ] Sync jobs from Adzuna
- [ ] Verify AI scoring works (check OpenAI credits)
- [ ] Test job application tracking
- [ ] Check dashboard statistics
- [ ] Verify mobile responsiveness
- [ ] Test all filters

---

## Environment Variables Summary

Required for production:

```bash
# Backend
NODE_ENV=production
PORT=5000 (or assigned by host)
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...

# Frontend
VITE_API_URL=https://your-backend-url.com
```

---

## Troubleshooting

### Backend not connecting to MongoDB
- Check MongoDB Atlas IP whitelist (0.0.0.0/0)
- Verify connection string format
- Check database user permissions

### Frontend can't reach backend
- Verify CORS is enabled in backend
- Check VITE_API_URL environment variable
- Ensure backend is deployed and running

### AI scoring not working
- Verify OPENAI_API_KEY is set
- Check OpenAI account has credits
- Review backend logs for errors

### Jobs not syncing
- Verify Adzuna API credentials
- Check Adzuna API rate limits
- Review backend logs

---

## Free Tier Limits

### Render
- Backend: 750 hours/month
- Spins down after 15 min inactivity (first request slow)
- 100 GB bandwidth

### MongoDB Atlas
- 512 MB storage
- Shared cluster
- Good for 100-500 users

### Vercel
- 100 GB bandwidth
- Serverless function executions

---

## Custom Domain (Optional)

### Render
1. Go to your service settings
2. Add custom domain
3. Update DNS records:
   - Type: CNAME
   - Name: @ or subdomain
   - Value: your-app.onrender.com

### Vercel
1. Go to project settings → Domains
2. Add domain
3. Follow DNS configuration instructions

---

## Monitoring

- **Render**: Built-in logs and metrics
- **MongoDB**: Atlas monitoring dashboard
- **OpenAI**: Usage dashboard at platform.openai.com

---

## Support

For issues:
1. Check logs in hosting dashboard
2. Verify all environment variables
3. Test API endpoints directly
4. Review MongoDB connection

---

**Deployment Date**: February 2026  
**Last Updated**: February 7, 2026
