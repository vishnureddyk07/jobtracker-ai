# JobTracker AI - AI-Powered Job Tracking Platform

A production-ready job tracking platform for students and freshers, combining AI-powered job matching with an intelligent assistant for natural language job search.

## Product Overview

JobTracker AI helps students and freshers discover and track job opportunities tailored to their skills and preferences. Key features:

- **Resume-based job matching**: AI scores jobs against your resume (0-100 scale)
- **Intelligent filters**: Manual + AI-controlled filtering (role, skills, location, etc.)
- **Smart application tracking**: Timeline-based tracking of job applications (Applied → Interview → Offer/Rejected)
- **AI assistant**: Natural language interface to search jobs and control filters
- **Best matches section**: AI-ranked jobs at the top of the feed

## User Flow

1. **Login**: Fixed test credentials (test@gmail.com / test@123)
2. **Resume Upload**: Upload PDF/TXT resume (mandatory before job feed)
3. **Job Feed**: Browse jobs with AI match scores and color-coded badges
4. **Apply**: Click Apply → opens external link → confirmation popup → saves application
5. **Track**: View all applications in Dashboard with timeline
6. **AI Assistant**: Ask questions like "Show remote React jobs" to filter jobs

## System Architecture
![workflow](https://github.com/user-attachments/assets/423ed8b2-07d5-43ac-b0e0-d51a4acc5e11)

![workflow (1)](https://github.com/user-attachments/assets/7a56f0a3-3503-457b-a6b1-3b14139f51de)

![workflow (2)](https://github.com/user-attachments/assets/54322cd9-3001-40a9-89ec-ffd8a963ecec)


```
Frontend (React + Vite)                Backend (Node.js + Fastify)
├── Login Page                        ├── Auth Routes (fixed creds)
├── Resume Upload                     ├── Resume Upload + PDF/TXT parsing
├── Job Feed (w/ filters)             ├── Adzuna Job Sync + normalization
├── Dashboard (applications)          ├── LangChain Job Matching
├── Chat Assistant                    ├── LangGraph AI Assistant
└── Filter Context                    └── Application Tracking Routes
                                      
Database (MongoDB)                    External APIs
├── users                             ├── Adzuna Job API
├── resumes                           └── OpenAI (GPT-3.5/4)
├── jobs
└── applications
```

## LangChain Job Matching Logic

**How it works:**
1. Resume text is extracted during upload and stored in MongoDB
2. When jobs are synced (via `/jobs/sync`), each job description is compared against the user's resume
3. LangChain + OpenAI GPT-3.5-turbo generates:
   - Match score (0-100)
   - Explanation (matching skills, relevant experience, keyword alignment)
4. Match score determines badge color:
   - 🟢 Green: >70% (high match)
   - 🟡 Yellow: 40–70% (medium match)
   - ⚪ Gray: <40% (low match)

**Prompt template:**
```
"Compare resume against job description. 
Score the match 0-100. Return JSON with: score (number), explanation (string).
Focus on: matching skills, relevant experience, keyword alignment."
```

## LangGraph Assistant Design

**Graph Structure:**
1. **Entry Point**: `detect_intent` node
2. **Intent Classification**: Detects one of three intents:
   - `update_filters`: User wants to filter jobs (e.g., "Show remote jobs")
   - `search_jobs`: User wants to search jobs (same as above, treated identically)
   - `product_help`: User asks about platform usage
3. **Conditional Routing**: Routes to specialized nodes based on intent
4. **Tool Nodes**:
   - `update_filters`: Returns structured JSON with filter updates
   - `search_jobs`: Returns structured JSON with filter updates
   - `product_help`: Returns helpful text response

**Example Intent Detection:**
- Input: "Show React developer jobs with Node.js"
- Output: `{ intent: "search_jobs", filters: { role: "React developer", skills: ["Node.js"] }, response: "Filtering for React developer jobs with Node.js..." }`
- Frontend receives this and updates React Context filters

**Filter Schema (JSON):**
```json
{
  "role": "React Developer",
  "skills": ["React", "Node.js"],
  "datePosted": "week",
  "jobType": "full-time",
  "workMode": "remote",
  "location": "Bangalore",
  "matchScore": "high"
}
```

## Application Tracking & Apply Popup UX

**Apply Flow:**
1. User clicks Apply button on job card
2. Opens job URL in new tab (external ATS)
3. When user returns to the app, confirmation popup appears:
   ```
   "Did you apply to [Job Title] at [Company]?"
   ```
4. Options:
   - "Yes, Applied" → Saves with current timestamp
   - "No, just browsing" → Dismisses popup, no save
   - "Applied Earlier" → Saves with older timestamp (useful for apps opened before our feature)

**Why this UX:**
- Respects user privacy (no tracking external clicks)
- Simple confirmation prevents accidental saves
- Timeline flexibility (users can backdate older applications)

**Timeline Storage:**
```javascript
timeline: [
  { status: "Applied", at: "2026-02-05T10:00:00Z" },
  { status: "Interview", at: "2026-02-07T14:30:00Z" },
  { status: "Offer", at: "2026-02-09T16:00:00Z" }
]
```

## MongoDB Schema Overview

### Users Collection
```javascript
{
  _id: ObjectId,
  email: "test@gmail.com",
  createdAt: Date,
  updatedAt: Date
}
```

### Resumes Collection
```javascript
{
  _id: ObjectId,
  userEmail: "test@gmail.com",
  originalName: "resume.pdf",
  contentType: "application/pdf",
  text: "...extracted text...",
  createdAt: Date,
  updatedAt: Date
}
```

### Jobs Collection
```javascript
{
  _id: ObjectId,
  externalId: "adzuna_12345",
  title: "React Developer",
  company: "TechCorp",
  location: "Bangalore, India",
  jobType: "Full-time",
  workMode: "Remote",
  description: "...job description...",
  applyUrl: "https://...",
  postedAt: Date,
  skills: ["React", "Node.js"],
  match: {
    score: 85,
    explanation: "Strong match: 5/5 skills present, 3+ years experience..."
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Applications Collection
```javascript
{
  _id: ObjectId,
  userEmail: "test@gmail.com",
  jobId: ObjectId,
  jobTitle: "React Developer",
  company: "TechCorp",
  status: "Applied" | "Interview" | "Offer" | "Rejected",
  timeline: [
    { status: "Applied", at: Date },
    { status: "Interview", at: Date }
  ],
  appliedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Routes

### Auth
- `POST /auth/login` - Fixed test credentials only

### Resume
- `POST /resume` - Upload/replace resume (multipart/form-data)
- `GET /resume/:email` - Get resume metadata

### Jobs
- `POST /jobs/sync` - Sync jobs from Adzuna + score with resume
  - Body: `{ query, location, email }`
- `GET /jobs` - Fetch jobs from DB with optional filters
  - Query: `?search=...&location=...`

### Applications
- `POST /applications` - Create application entry
  - Body: `{ email, jobId, jobTitle, company, appliedEarlier, appliedAt }`
- `GET /applications` - List user's applications
  - Query: `?email=...`
- `PATCH /applications/:id/status` - Update status
  - Body: `{ status }`

### AI
- `POST /ai/assistant` - Run LangGraph assistant
  - Body: `{ input }`
  - Response: `{ message, action, filters }`

## Scalability Considerations

### Current Limitations
1. **Single Resume per User**: Simplifies MVP but can be extended to versioning
2. **Fixed Credentials**: No auth complexity; suitable for early testing
3. **Adzuna API Rate Limits**: ~1 request/sec; use caching or pagination for production
4. **LLM Costs**: Job matching calls GPT-3.5-turbo; consider batch processing for large datasets
5. **No Pagination**: Job feed loads all results; add pagination for 1000+ jobs

### Scaling Path
1. **Job Caching**: Cache jobs for 6-12 hours; re-score only new jobs
2. **Batch Scoring**: Score jobs asynchronously (background queue)
3. **Resume Versioning**: Allow multiple resume versions; user selects active one
4. **Auth System**: Replace fixed credentials with OAuth2 or simple JWT
5. **Job Search Optimization**: Use Elasticsearch for fast filtering
6. **AI Rate Limiting**: Cache assistant intents; add conversation history
7. **Deployment**: Use Docker, Kubernetes; Redis for session/cache; CDN for frontend

## Trade-offs & Limitations

### Design Trade-offs
1. **Client-side Filtering**: Filters applied client-side (Context API) to avoid multiple API calls
   - Pro: Instant feedback, offline-capable
   - Con: Requires all jobs in memory; doesn't scale to 100k+ jobs
   - Solution: Add server-side filtering + pagination for production

2. **Single Sync Endpoint**: One `/jobs/sync` instead of separate search endpoints
   - Pro: Simpler API, LangChain scoring happens once
   - Con: No real-time updates
   - Solution: Implement incremental sync + background jobs

3. **Direct External Apply**: Uses external job links; no in-app apply
   - Pro: No legal/compliance issues, simpler UX
   - Con: Lose user context during apply
   - Solution: Use popup confirmation (already implemented)

4. **No Resume Parsing**: Stores raw text; no structured skill extraction
   - Pro: Simpler implementation, works with any resume format
   - Con: LLM must infer skills from text
   - Solution: Use specialized resume parsing APIs (e.g., Affinda, Lever)

### Limitations
- No email notifications
- No user analytics
- No job recommendations beyond match scoring
- No saved jobs/favorites
- Limited to test email/password
- No user settings/preferences
- No mobile optimization (can be added with Tailwind)

## Development & Deployment

### Local Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev  # Runs on :5000

# Frontend
cd frontend
npm install
cp .env.example .env
npm run dev  # Runs on :5173
```

### Environment Variables
**Backend (.env)**:
```
MONGODB_URI=mongodb+srv://...
MONGODB_DB=jobtracker
ADZUNA_APP_ID=your_id
ADZUNA_APP_KEY=your_key
ADZUNA_COUNTRY=in
OPENAI_API_KEY=sk-...
PORT=5000
```

**Frontend (.env)**:
```
VITE_API_BASE_URL=http://localhost:5000
```

### Deployment
- **Backend**: Render (Fastify + Node.js)
- **Frontend**: Vercel or Netlify
- **Database**: MongoDB Atlas

### Tech Stack Justification
- **Fastify**: 2x faster than Express; minimal overhead
- **MongoDB**: Flexible schema for job variations
- **LangChain**: Abstracts LLM complexity; easy to swap providers
- **LangGraph**: Stateful workflow management; better than callbacks
- **React Context**: Lightweight global state for filters; avoids Redux overhead
- **Vite**: 30x faster dev server than Create React App

