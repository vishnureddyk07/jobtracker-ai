# 🎯 Deployment Checklist

## ✅ Pre-Deployment

- [x] Git initialized
- [x] Initial commit created
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas account created
- [ ] OpenAI API key obtained
- [ ] Adzuna API credentials obtained

---

## 🔐 Accounts Needed

### 1. GitHub (Free)
- URL: https://github.com
- Purpose: Code hosting
- Action: Create account, create new repository "jobtracker"

### 2. Render (Free Tier)
- URL: https://render.com
- Purpose: Backend + Frontend hosting
- Action: Sign up, connect GitHub

### 3. MongoDB Atlas (Free M0 Cluster)
- URL: https://mongodb.com/cloud/atlas
- Purpose: Database
- Action: Create cluster, get connection string

### 4. OpenAI (Paid - but cheap)
- URL: https://platform.openai.com
- Purpose: AI job matching
- Action: Get API key, add $5 credit
- Cost: ~$0.002 per job scoring

### 5. Adzuna (Free)
- URL: https://developer.adzuna.com
- Purpose: Real job data
- Action: Register app, get API credentials

---

## 📝 Step-by-Step Deployment

### Step 1: Push to GitHub (5 min)

```powershell
# Already done: git init, git add, git commit

# Now create GitHub repo and push:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jobtracker.git
git push -u origin main
```

### Step 2: Set Up MongoDB (10 min)

1. Go to https://cloud.mongodb.com
2. Sign in / Create account
3. Create New Project → "JobTracker"
4. Build a Database → M0 Free
5. Username: `jobtracker_user`
6. Password: Generate strong password → Save it!
7. IP Access: Add IP → `0.0.0.0/0` (Allow from anywhere)
8. Finish and Close
9. Connect → Drivers → Copy connection string
10. Replace `<password>` with your password
11. Save: `mongodb+srv://jobtracker_user:PASSWORD@cluster0.xxxxx.mongodb.net/jobtracker`

### Step 3: Deploy Backend on Render (10 min)

1. Go to https://dashboard.render.com
2. New → Web Service
3. Connect Repository → Select `jobtracker`
4. Name: `jobtracker-api`
5. Runtime: Node
6. Build Command: `npm install`
7. Start Command: `node server.js`
8. Plan: Free
9. Advanced → Add Environment Variables:
   ```
   NODE_ENV = production
   PORT = 5000
   MONGODB_URI = mongodb+srv://jobtracker_user:PASSWORD@...
   OPENAI_API_KEY = sk-proj-...
   ADZUNA_APP_ID = your_app_id
   ADZUNA_APP_KEY = your_app_key
   ```
10. Create Web Service
11. Wait for deployment (~3 min)
12. Copy URL: `https://jobtracker-api.onrender.com`

### Step 4: Deploy Frontend on Render (10 min)

1. Dashboard → New → Static Site
2. Connect Repository → Same `jobtracker` repo
3. Name: `jobtracker-frontend`
4. Build Command: `cd frontend && npm install && npm run build`
5. Publish Directory: `frontend/dist`
6. Add Environment Variable:
   ```
   VITE_API_BASE_URL = https://jobtracker-api.onrender.com
   ```
7. Create Static Site
8. Wait for build (~2-3 min)
9. Your app is live! 🎉

---

## 🧪 Testing Deployment

1. Open your frontend URL: `https://jobtracker-frontend.onrender.com`
2. Click "Get Started" or "Login"
3. Register new account: `test@example.com` / `password123`
4. Go to "Resume Upload"
5. Upload your resume (PDF/DOCX/TXT)
6. Go to "Job Feed"
7. Click "Sync Jobs" button
8. Wait for jobs to load with AI scores
9. Click on a job → "Apply Now"
10. Verify popup appears
11. Check "Dashboard" for stats

---

## 🐛 Common Issues

### Issue: Backend returns 502
**Solution**: Check Render logs, verify all env vars set

### Issue: Frontend shows "Network Error"  
**Solution**: Update `VITE_API_BASE_URL` in Render dashboard

### Issue: No jobs loading
**Solution**: Check Adzuna credentials, verify backend logs

### Issue: All jobs show 25% score
**Solution**: OpenAI API key missing or out of credits

### Issue: MongoDB connection timeout
**Solution**: Check IP whitelist set to `0.0.0.0/0`

---

## 📊 Monitoring

### Render Dashboard
- View logs: Service → Logs tab
- Check metrics: Events, Deploy history
- Free tier: Sleeps after 15 min inactivity

### MongoDB Atlas
- Monitor connections: Database → Metrics
- View data: Collections → Browse

### OpenAI Usage
- Check usage: https://platform.openai.com/usage
- Costs: ~$0.002 per job scoring

---

## 💰 Cost Estimate

**Free Tier (0-100 users)**:
- Render Backend: Free (750 hrs/month)
- Render Frontend: Free (100 GB bandwidth)
- MongoDB: Free (512 MB)
- Adzuna API: Free (1000 calls/month)
- OpenAI: ~$2-5/month (1000-2500 job scorings)

**Total**: ~$2-5/month (only OpenAI)

---

## 🎓 Next Steps After Deployment

1. **Custom Domain** (Optional):
   - Buy domain from Namecheap/GoDaddy
   - Add to Render: Settings → Custom Domain

2. **Analytics**:
   - Add Google Analytics
   - Track user behavior

3. **Email Notifications**:
   - Integrate SendGrid/Mailgun
   - Send job alerts

4. **Improvements**:
   - Add more job boards (Indeed, LinkedIn)
   - Enhance AI matching
   - Add saved searches

---

## 📱 Share Your App!

Once deployed, share with:
- Friends looking for jobs
- Career counselors
- University placement offices
- LinkedIn connections

---

**Estimated Total Time**: 45 minutes  
**Difficulty**: ⭐⭐⚪⚪⚪ (Beginner-friendly)

**Questions?** Check logs first, then review [DEPLOYMENT.md](./DEPLOYMENT.md)
