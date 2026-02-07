import { Job } from "../models/Job.js";
import { Resume } from "../models/Resume.js";
import { scoreJobWithResume } from "../ai/jobMatcher.js";
import { getResumeFromStore, setResumeInStore } from "../config/resumeStore.js";

// In-memory cache for Adzuna jobs (works without MongoDB)
let cachedAdzunaJobs = [];

// Mock jobs for offline mode - Realistic Indian & Global companies
const mockJobs = [
  {
    _id: "job_1",
    externalId: "ext_1",
    title: "React Developer",
    company: "Infosys",
    location: "Bangalore",
    jobType: "Full-time",
    workMode: "Hybrid",
    description: "Join our digital transformation team to build modern web applications. We are seeking a React Developer with 2-4 years of experience to work on enterprise-scale projects.\n\nResponsibilities:\n• Develop responsive web applications using React.js and modern JavaScript\n• Collaborate with backend teams to integrate RESTful APIs\n• Write clean, maintainable code with proper documentation\n• Participate in code reviews and agile ceremonies\n\nRequired Skills: React.js, JavaScript, HTML/CSS, Redux, REST APIs\nExperience: 2-4 years in frontend development",
    applyUrl: "https://careers.infosys.com/apply/1",
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    skills: ["React", "JavaScript", "Redux", "HTML", "CSS", "REST APIs"],
  },
  {
    _id: "job_2",
    externalId: "ext_2",
    title: "Frontend Engineer",
    company: "Flipkart",
    location: "Bangalore",
    jobType: "Full-time",
    workMode: "On-site",
    description: "Flipkart is looking for talented Frontend Engineers to build next-generation e-commerce experiences. Join our platform team and impact millions of users.\n\nResponsibilities:\n• Design and develop scalable frontend architectures\n• Optimize application performance and user experience\n• Work with product managers and designers on feature development\n• Mentor junior developers and contribute to best practices\n\nRequired Skills: React, TypeScript, Next.js, Webpack, Testing (Jest)\nExperience: 3-6 years in frontend development",
    applyUrl: "https://www.flipkartcareers.com/apply/2",
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    skills: ["React", "TypeScript", "Next.js", "Webpack", "Jest", "Performance Optimization"],
  },
  {
    _id: "job_3",
    externalId: "ext_3",
    title: "Backend Developer",
    company: "Razorpay",
    location: "Bangalore",
    jobType: "Full-time",
    workMode: "Remote",
    description: "Razorpay is India's leading payments company. We're hiring Backend Developers to build robust payment systems that process billions in transactions.\n\nResponsibilities:\n• Design and implement scalable microservices architecture\n• Build RESTful APIs with high availability and low latency\n• Optimize database queries and system performance\n• Ensure security and compliance in payment flows\n\nRequired Skills: Node.js, Python, PostgreSQL, Redis, Microservices, AWS\nExperience: 2-5 years in backend development",
    applyUrl: "https://razorpay.com/jobs/apply/3",
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    skills: ["Node.js", "Python", "PostgreSQL", "Redis", "AWS", "Microservices"],
  },
  {
    _id: "job_4",
    externalId: "ext_4",
    title: "Frontend Engineer",
    company: "Zoho",
    location: "Chennai",
    jobType: "Full-time",
    workMode: "On-site",
    description: "Zoho Corporation is seeking Frontend Engineers to work on our suite of business applications. Build user-facing features used by millions of businesses worldwide.\n\nResponsibilities:\n• Develop responsive UI components in React.js\n• Collaborate with backend teams to integrate APIs\n• Ensure cross-browser compatibility and performance\n• Participate in design reviews and UI improvements\n\nRequired Skills: React, JavaScript, HTML/CSS, REST APIs, Git\nExperience: 1-3 years in frontend development",
    applyUrl: "https://careers.zoho.com/apply/4",
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    skills: ["React", "Node.js", "Java", "MySQL", "Git", "REST APIs"],
  },
  {
    _id: "job_5",
    externalId: "ext_5",
    title: "Data Analyst",
    company: "Swiggy",
    location: "Hyderabad",
    jobType: "Full-time",
    workMode: "Hybrid",
    description: "Swiggy's data team is looking for analysts to drive business insights. Work with large datasets to optimize delivery operations and customer experience.\n\nResponsibilities:\n• Analyze business metrics and create actionable dashboards\n• Work with SQL, Python for data extraction and analysis\n• Collaborate with product and ops teams on data-driven decisions\n• Build predictive models to forecast demand and optimize resources\n\nRequired Skills: SQL, Python, Excel, Tableau, Statistics\nExperience: 1-4 years in data analysis",
    applyUrl: "https://careers.swiggy.com/apply/5",
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    skills: ["SQL", "Python", "Excel", "Tableau", "Statistics", "Data Analysis"],
  },
  {
    _id: "job_6",
    externalId: "ext_6",
    title: "Backend Developer",
    company: "Microsoft",
    location: "Hyderabad",
    jobType: "Full-time",
    workMode: "Hybrid",
    description: "Microsoft India is hiring Backend Developers for Azure cloud services. Build services that power enterprise cloud infrastructure globally.\n\nResponsibilities:\n• Develop and maintain backend services and APIs\n• Write clean, testable code in C# or Python\n• Collaborate with global teams across time zones\n• Ensure high availability and scalability of services\n\nRequired Skills: C#, Python, Azure, SQL, CI/CD\nExperience: 2-5 years in backend development",
    applyUrl: "https://careers.microsoft.com/apply/6",
    postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    skills: ["C#", "Python", "Azure", "Kubernetes", "Docker", "CI/CD"],
  },
  {
    _id: "job_7",
    externalId: "ext_7",
    title: "ML Engineer",
    company: "Google",
    location: "Bangalore",
    jobType: "Full-time",
    workMode: "On-site",
    description: "Google is looking for ML Engineers to work on cutting-edge machine learning projects. Help build AI products used by billions.\n\nResponsibilities:\n• Design and train machine learning models at scale\n• Deploy ML pipelines to production environments\n• Optimize model performance and inference speed\n• Collaborate with research teams on new techniques\n\nRequired Skills: Python, TensorFlow, PyTorch, ML Algorithms, Cloud ML\nExperience: 3-6 years in machine learning engineering",
    applyUrl: "https://careers.google.com/apply/7",
    postedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    skills: ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Cloud ML", "Algorithms"],
  },
  {
    _id: "job_8",
    externalId: "ext_8",
    title: "React Developer",
    company: "Amazon",
    location: "Pune",
    jobType: "Full-time",
    workMode: "Remote",
    description: "Amazon is hiring React Developers for our e-commerce platform. Build customer-facing experiences for millions of shoppers.\n\nResponsibilities:\n• Develop and optimize React-based UI features\n• Work with APIs to deliver data-driven components\n• Ensure accessibility and performance best practices\n• Collaborate with product and design teams\n\nRequired Skills: React, TypeScript, Redux, GraphQL, Testing\nExperience: 3-6 years in frontend development",
    applyUrl: "https://www.amazon.jobs/apply/8",
    postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    skills: ["React", "TypeScript", "Redux", "GraphQL", "Performance Optimization", "Accessibility"],
  },
  {
    _id: "job_9",
    externalId: "ext_9",
    title: "Frontend Engineer",
    company: "TCS",
    location: "Chennai",
    jobType: "Full-time",
    workMode: "Hybrid",
    description: "Tata Consultancy Services is looking for Frontend Engineers to work on client projects across various domains.\n\nResponsibilities:\n• Develop web applications using React and Angular\n• Implement responsive designs and cross-browser compatibility\n• Work closely with UX designers and backend developers\n• Follow agile methodologies and deliver on sprint commitments\n\nRequired Skills: React, Angular, JavaScript, HTML5, CSS3, Bootstrap\nExperience: 1-3 years in frontend development",
    applyUrl: "https://www.tcs.com/careers/apply/9",
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    skills: ["React", "Angular", "JavaScript", "HTML5", "CSS3", "Bootstrap"],
  },
  {
    _id: "job_10",
    externalId: "ext_10",
    title: "Backend Developer",
    company: "Accenture",
    location: "Pune",
    jobType: "Full-time",
    workMode: "Hybrid",
    description: "Accenture is seeking Backend Developers to build enterprise solutions for global clients. Work on diverse technologies and domains.\n\nResponsibilities:\n• Develop RESTful APIs and microservices\n• Design database schemas and optimize queries\n• Integrate with third-party services and APIs\n• Ensure code quality through testing and reviews\n\nRequired Skills: Java, Spring Boot, MySQL, REST APIs, Microservices\nExperience: 2-4 years in backend development",
    applyUrl: "https://www.accenture.com/careers/apply/10",
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    skills: ["Java", "Spring Boot", "MySQL", "REST APIs", "Microservices", "Docker"],
  },
];

const normalizeJob = (job) => {
  const locationParts = [job.location?.display_name, job.location?.area]
    .flat()
    .filter(Boolean);

  const location =
    typeof job.location?.display_name === "string"
      ? job.location.display_name
      : locationParts.join(", ");

  const title = job.title?.trim() || "Untitled";
  const company = job.company?.display_name?.trim() || "Unknown";
  const description = job.description?.trim() || "";
  const applyUrl = job.redirect_url || job.adzuna_url || "";
  const postedAt = job.created ? new Date(job.created) : null;

  // Best-effort mapping
  const jobType =
    job.contract_time || job.contract_type || "Full-time";
  const workMode = job.remote ? "Remote" : "On-site";

  return {
    externalId: String(job.id),
    title,
    company,
    location: location || "Unknown",
    jobType,
    workMode,
    description,
    applyUrl,
    postedAt,
    skills: [],
  };
};

const buildAdzunaUrl = ({ query, location, page = 1, country }) => {
  const base = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID || "",
    app_key: process.env.ADZUNA_APP_KEY || "",
    results_per_page: "20",
  });

  if (query) params.set("what", query);
  if (location) params.set("where", location);

  return `${base}?${params.toString()}`;
};

export default async function jobsRoutes(fastify) {
  fastify.get("/jobs/health", async () => ({ status: "ok" }));

  // Fetch from Adzuna and store normalized results
  fastify.post("/jobs/sync", async (request, reply) => {
    console.log("🔄 Request body:", request.body);
    console.log("🔄 Request headers:", request.headers);
    
    const { query = "developer", location = "", page = 1, email = "", resumeText: requestResumeText = "" } =
      request.body || {};

    console.log("🔄 Job sync request:", { query, location, page, email });

    const country = process.env.ADZUNA_COUNTRY || "in";
    const url = buildAdzunaUrl({ query, location, page, country });

    console.log("🔑 Actual env values:", {
      ADZUNA_APP_ID: process.env.ADZUNA_APP_ID || "MISSING",
      ADZUNA_APP_KEY: process.env.ADZUNA_APP_KEY || "MISSING",
      ADZUNA_API_KEY: process.env.ADZUNA_API_KEY || "MISSING",
    });

    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
      console.error("❌ Missing Adzuna credentials");
      return reply
        .code(400)
        .send({ message: "Missing Adzuna API credentials" });
    }

    console.log("🌐 Calling Adzuna URL:", url);
    const response = await fetch(url);
    console.log("📡 Adzuna response status:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Adzuna API error:", errorText);
      return reply.code(502).send({ 
        message: "Adzuna API error", 
        details: errorText.substring(0, 200) 
      });
    }

    const payload = await response.json();
    const results = Array.isArray(payload.results) ? payload.results : [];

    const normalized = results.map(normalizeJob).filter((job) => job.applyUrl);

    // Optionally score jobs if resume is available
    const userEmail = String(email || "").trim().toLowerCase();
    let resumeText = String(requestResumeText || "").trim();

    console.log(`🔍 Looking for resume. Email: "${userEmail}", RequestResumeText length: ${resumeText.length}`);

    // Use resume from request body if provided, otherwise try to load from storage
    if (!resumeText && userEmail) {
      console.log(`📂 Resume not in request, checking storage for ${userEmail}...`);
      try {
        const resume = await Resume.findOne({ userEmail });
        resumeText = resume?.text || "";
        if (resumeText) console.log(`✅ Found resume in DB: ${resumeText.length} chars`);
      } catch (error) {
        console.log(`⚠️ DB lookup failed: ${error.message}`);
        resumeText = "";
      }

      if (!resumeText) {
        const cachedResume = getResumeFromStore(userEmail);
        resumeText = cachedResume?.text || "";
        if (resumeText) console.log(`✅ Found resume in cache: ${resumeText.length} chars`);
      }
    }

    // If we got a resume, store it for future use
    if (resumeText && userEmail) {
      setResumeInStore(userEmail, { text: resumeText, uploadedAt: new Date() });
    }

    console.log(`📋 Sync with email: ${userEmail}, Final resume length: ${resumeText.length} chars`);

    const withScores = [];

    for (const job of normalized) {
      if (!resumeText) {
        withScores.push({
          ...job,
          match: { 
            score: 20, 
            explanation: "Upload resume to see personalized match score",
            source: "Pending"
          },
        });
        continue;
      }

      const jobText = String(job.description || "").slice(0, 4000);
      const resumeSlice = String(resumeText || "").slice(0, 6000);

      try {
        const match = await scoreJobWithResume({
          resumeText: resumeSlice,
          jobText,
        });

        console.log(`✅ Scored job "${job.title}" from ${job.company}: ${match.score}%`);

        withScores.push({
          ...job,
          match,
        });
      } catch (error) {
        console.error("Error scoring job:", error);
        // Even on error, scoreJobWithResume returns fallback with numeric score
        // This error should not happen, but if it does, ensure we have a score
        withScores.push({
          ...job,
          match: { 
            score: 25, 
            explanation: "Resume analyzed based on job requirements",
            source: "Fallback"
          },
        });
      }
    }

    // Store in memory cache (works without MongoDB)
    cachedAdzunaJobs = withScores.map((job, index) => ({
      ...job,
      _id: job._id || `adzuna_${job.externalId || index}`,
    }));

    // Try to save to MongoDB if available
    try {
      const bulkOps = withScores.map((job) => ({
        updateOne: {
          filter: { externalId: job.externalId },
          update: { $set: job },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        await Job.bulkWrite(bulkOps);
      }
    } catch (error) {
      console.log("Could not save to MongoDB (using in-memory cache):", error.message);
    }

    return reply.send({
      message: "Jobs synced",
      count: withScores.length,
    });
  });

  // Read jobs with basic query filters (frontend also filters client-side)
  fastify.get("/jobs", async (request) => {
    const { search = "", location = "", email = "" } = request.query || {};

    let jobs = [];

    // Priority 1: Use cached Adzuna jobs if available
    if (cachedAdzunaJobs.length > 0) {
      jobs = [...cachedAdzunaJobs];
      console.log(`📦 Using ${jobs.length} cached Adzuna jobs`);
    } else {
      // Priority 2: Try to get jobs from database
      try {
        const dbJobs = await Job.find({}).lean().exec();
        if (dbJobs && dbJobs.length > 0) {
          jobs = dbJobs.map(job => ({
            ...job,
            _id: job._id.toString(),
          }));
          console.log(`💾 Using ${jobs.length} jobs from MongoDB`);
        }
      } catch (error) {
        console.log("Could not fetch from DB:", error.message);
      }

      // Priority 3: Fallback to mock jobs
      if (jobs.length === 0) {
        jobs = [...mockJobs];
        console.log(`🎭 Using ${jobs.length} mock jobs (fallback)`);
      }
    }
    
    if (search) {
      const searchLower = String(search).toLowerCase();
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (location) {
      const locationLower = String(location).toLowerCase();
      jobs = jobs.filter(job =>
        job.location.toLowerCase().includes(locationLower)
      );
    }

    // Score jobs with user's resume if email is provided
    if (email) {
      console.log(`📧 Scoring jobs for email: ${email}`);
      const resumeText = getResumeFromStore(email);
      
      if (resumeText) {
        console.log(`✅ Found resume for ${email}, scoring ${jobs.length} jobs...`);
        jobs = await Promise.all(jobs.map(async (job) => {
          try {
            const match = await scoreJobWithResume(job, resumeText);
            return {
              ...job,
              match: match,
            };
          } catch (error) {
            console.log(`⚠️ Error scoring job ${job._id}:`, error.message);
            return job;
          }
        }));
      } else {
        console.log(`❌ No resume found for ${email}`);
      }
    }

    return { jobs };
  });
}
