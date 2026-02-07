# JobTracker Features

## Resume-Based Job Matching with LangChain

### Core Features Implemented

#### 1. **AI-Powered Job Scoring** ✅
- **LangChain Integration**: Uses `@langchain/openai` for intelligent resume-job matching
- **Resume Analysis**: Parses user resumes to extract skills, experience, and qualifications
- **Job Matching**: Each job is scored against the user's resume (0-100%)
- **Smart Explanations**: AI generates detailed explanations for each match score

#### 2. **Color-Coded Match Badges** ✅
- **Green Badge (>70%)**: Strong fit - indicates excellent match
- **Yellow Badge (40-70%)**: Partial fit - indicates moderate match
- **Gray Badge (<40%)**: Low fit - indicates weak match
- Badges display on every job card with the AI-generated score

#### 3. **Best Matches Section** ✅
- Displays **top 6-8 highest scoring jobs** at the top of the Job Feed
- Only shows jobs that have been scored by AI
- Sorted by match score (highest first)
- Separate section from "All Jobs" for better visibility

#### 4. **Match Explanations** ✅
Each job card shows:
- **Matching Skills**: Specific skills from resume that match job requirements
- **Relevant Experience**: How experience level aligns with job requirements
- **Keywords Alignment**: Key terms and technologies that match

Example explanations:
- **Strong Match (>70%)**: "Strong match with required skills: React, Node.js, Python"
- **Partial Match (40-70%)**: "Some matching skills: JavaScript, HTML, CSS"
- **Low Match (<40%)**: "Limited skill overlap - May require additional qualifications"

---

## Technical Implementation

### Backend (`/routes/jobs.js`)

```javascript
// GET /jobs endpoint now accepts email parameter
fastify.get("/jobs", async (request) => {
  const { search = "", location = "", email = "" } = request.query;
  
  // Retrieve user's resume from storage
  const resumeText = getResumeFromStore(email);
  
  // Score each job with LangChain
  if (resumeText) {
    jobs = await Promise.all(jobs.map(async (job) => {
      const match = await scoreJobWithResume(job, resumeText);
      return { ...job, match };
    }));
  }
});
```

### Frontend

#### API Service (`/frontend/src/services/api.js`)
```javascript
// Pass email to get scored jobs
export const fetchJobs = async ({ search, location, email }) => {
  const url = new URL(`${API_BASE_URL}/jobs`);
  if (email) url.searchParams.set("email", email);
  // ...
};
```

#### Job Feed (`/frontend/src/pages/JobFeed.jsx`)
```javascript
// Load jobs with user email for scoring
const loadJobs = async () => {
  const result = await fetchJobs({
    search: filters.role,
    location: filters.location,
    email: email, // ← Now passes email!
  });
};

// Extract best matches (top 6-8 jobs)
const bestMatches = useMemo(() => {
  return [...filteredJobs]
    .filter((job) => typeof job._matchScore === "number")
    .sort((a, b) => (b._matchScore ?? 0) - (a._matchScore ?? 0))
    .slice(0, 6);
}, [filteredJobs]);
```

#### Job Card (`/frontend/src/components/JobCard.jsx`)
```javascript
// Color-coded badge
const badgeClass =
  !isScored ? "badge gray" 
  : score > 70 ? "badge green" 
  : score >= 40 ? "badge yellow" 
  : "badge gray";

// Display match explanation
{job.match?.explanation && (
  <div className="job-match-explanation">
    <p>{job.match.explanation}</p>
  </div>
)}
```

---

## User Journey

1. **Upload Resume** → User uploads resume on Resume Upload page
2. **Resume Stored** → Resume text stored with user's email as key
3. **Navigate to Job Feed** → User browses available jobs
4. **Jobs Fetched** → Frontend passes email to backend
5. **AI Scoring** → Backend retrieves resume and scores each job with LangChain
6. **Results Displayed**:
   - **Best Matches** section shows top 6-8 jobs
   - Each job has a color-coded badge (green/yellow/gray)
   - Each job shows match explanation
   - Jobs sorted by relevance

---

## LangChain Usage

### AI Job Matching (`/ai/jobMatcher.js`)
```javascript
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3,
});

const prompt = PromptTemplate.fromTemplate(`
  Analyze this job and resume...
  Provide: score (0-100), explanation
`);

// Chain execution
const chain = prompt.pipe(model).pipe(parser);
const result = await chain.invoke({ jobText, resumeText });
```

**Key Components**:
- **ChatOpenAI**: GPT-4o-mini model for cost-effective scoring
- **PromptTemplate**: Structured prompts for consistent results
- **JsonOutputParser**: Ensures valid JSON responses
- **Retry Logic**: Handles API failures gracefully

---

## Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| LangChain Integration | ✅ | AI-powered job matching with OpenAI |
| Color-Coded Badges | ✅ | Green (>70%), Yellow (40-70%), Gray (<40%) |
| Best Matches Section | ✅ | Top 6-8 highest scoring jobs |
| Match Explanations | ✅ | Detailed reasons for each match score |
| Resume Storage | ✅ | Stored with email as key |
| Real-time Scoring | ✅ | Jobs scored when fetched |
| Responsive UI | ✅ | Modern, clean design |

---

## Testing the Features

1. **Start the application**: `npm start`
2. **Login** with any email (e.g., `test@example.com`)
3. **Upload Resume** on Resume Upload page
4. **Go to Job Feed**
5. **Observe**:
   - Jobs now show match scores with colored badges
   - "Best Matches" section appears at the top
   - Each job shows why it matches your resume
   - Scores range from 0-100%

---

## Environment Variables Required

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Without this, jobs will show "Not Scored" badges.

---

## Future Enhancements (Optional)

- [ ] Caching scores to reduce API calls
- [ ] User feedback on match accuracy
- [ ] More detailed skill breakdowns
- [ ] Match score history tracking
- [ ] A/B testing different prompts

---

**Last Updated**: January 2025  
**AI Model**: GPT-4o-mini via LangChain  
**Framework**: Fastify (Backend) + React (Frontend)
