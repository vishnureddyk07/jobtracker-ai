# 🚀 Quick Deployment Guide

## Choose Your Platform

### 🎯 Render (Easiest - Recommended)
**Best for**: Beginners, free tier available  
**Deploy time**: 10 minutes

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/jobtracker.git
git push -u origin main
```

2. **Deploy Backend**:
   - Go to https://render.com → New Web Service
   - Connect GitHub repo
   - Settings:
     - Build: `npm install`
     - Start: `node server.js`
   - Add env vars (see below)

3. **Deploy Frontend**:
   - Render → New Static Site
   - Build: `cd frontend && npm install && npm run build`
   - Publish: `frontend/dist`
   - Add: `VITE_API_BASE_URL=https://your-backend.onrender.com`

---

### ⚡ Vercel (Fast)
**Best for**: Quick deployments  
**Deploy time**: 5 minutes

```bash
npm i -g vercel
vercel --prod
```

Add env vars in Vercel dashboard.

---

### 🚂 Railway (Simple)
**Best for**: Automatic deploys  
**Deploy time**: 5 minutes

1. Go to https://railway.app
2. Connect GitHub repo
3. Add environment variables
4. Deploy automatically

---

## 📋 Environment Variables

### Backend (.env)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobtracker
OPENAI_API_KEY=sk-proj-...
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key
```

### Frontend
```bash
VITE_API_BASE_URL=https://your-backend-url.com
```

---

## 🗄️ Set Up MongoDB

1. Go to https://mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP: `0.0.0.0/0`
5. Get connection string

---

## 🎬 Test Deployment

1. Visit your frontend URL
2. Login with test account
3. Upload resume
4. Sync jobs
5. Check AI scores work

---

## 🆘 Troubleshooting

**Backend error 500**: Check env vars  
**Frontend can't connect**: Update VITE_API_BASE_URL  
**MongoDB timeout**: Check IP whitelist  
**AI not working**: Verify OpenAI API key has credits

---

**Need detailed instructions?** See [DEPLOYMENT.md](./DEPLOYMENT.md)
