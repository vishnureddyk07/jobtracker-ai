import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

let model = null;

function getModel() {
  if (!model && process.env.OPENAI_API_KEY) {
    model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
      temperature: 0.2,
    });
  }
  return model;
}

// Fallback: Rule-based scoring when no API is available
const calculateFallbackScore = (resumeText, jobText) => {
  if (!resumeText || !jobText) {
    return { score: 25, explanation: "Insufficient data for matching" };
  }

  const resume = String(resumeText || "").toLowerCase();
  const job = String(jobText || "").toLowerCase();

  let score = 0;
  const explanation = [];

  // Extended skill list for better matching
  const skills = [
    "javascript", "react", "node", "python", "java", "typescript",
    "aws", "docker", "kubernetes", "sql", "mongodb", "git",
    "html", "css", "vue", "angular", "express", "fastify",
    "c#", "golang", "rust", "scala", "kotlin", "swift",
    "postgresql", "mysql", "redis", "elasticsearch", "graphql",
    "terraform", "jenkins", "github", "gitlab", "microservices",
    "machine learning", "tensorflow", "pytorch", "pandas", "numpy",
    "html5", "css3", "bootstrap", "material", "tailwind"
  ];
  
  let matchedSkills = 0;
  for (const skill of skills) {
    if (resume.includes(skill) && job.includes(skill)) {
      matchedSkills++;
    }
  }
  score += Math.min(40, matchedSkills * 4);
  if (matchedSkills > 0) {
    explanation.push(`${matchedSkills} matching skill${matchedSkills > 1 ? 's' : ''}`);
  }

  // Experience keywords (20 points max)
  const expKeywords = ["experience", "years", "senior", "lead", "principal", "architect", "engineer"];
  let expMatches = 0;
  for (const keyword of expKeywords) {
    if (resume.includes(keyword) && job.includes(keyword)) {
      expMatches++;
    }
  }
  score += Math.min(20, expMatches * 3);
  if (expMatches > 0) explanation.push("Experience aligned");

  // Role matching (20 points max)
  const roles = [
    "backend", "frontend", "full.?stack", "devops", "data",
    "engineer", "developer", "architect", "lead", "specialist"
  ];
  let roleMatches = 0;
  for (const role of roles) {
    const regex = new RegExp(role);
    if (regex.test(resume) && regex.test(job)) {
      roleMatches++;
    }
  }
  score += Math.min(20, roleMatches * 5);
  if (roleMatches > 0) explanation.push("Role aligned");

  // Location bonus (10 points max)
  const locations = ["remote", "hybrid", "on.?site"];
  for (const loc of locations) {
    const regex = new RegExp(loc);
    if (regex.test(resume) && regex.test(job)) {
      score += 10;
      explanation.push("Location preference match");
      break;
    }
  }

  // Ensure score is in valid range (minimum 25 for any resume match)
  score = Math.max(25, Math.min(100, score));

  return {
    score,
    explanation: explanation.length > 0 
      ? explanation.join(", ") 
      : "Resume analyzed based on job requirements"
  };
};

const MATCHING_PROMPT = new PromptTemplate({
  template: `You are a strict job matching evaluator.
Given a resume and a job description, score the match from 0 to 100.
Return JSON only with keys: score (number), explanation (string).

Resume:
{resume}

Job Description:
{job}

Focus on: matching skills, relevant experience, and keyword alignment.
Make explanation concise but specific (1-3 sentences).
JSON only.`,
  inputVariables: ["resume", "job"],
});

export const scoreJobWithResume = async ({ resumeText, jobText }) => {
  try {
    // Try AI-powered scoring first
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is missing");
    }

    const model = getModel();
    if (!model) {
      throw new Error("OpenAI model initialization failed");
    }

    const prompt = await MATCHING_PROMPT.format({
      resume: resumeText,
      job: jobText,
    });

    const response = await model.invoke(prompt);
    let content = response?.content || "{}";

    content = String(content)
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(content);
    const score = Number(parsed.score);
    const explanation = String(parsed.explanation || "");

    if (!Number.isFinite(score)) {
      throw new Error("Invalid score from OpenAI");
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      explanation,
      source: "AI"
    };
  } catch (error) {
    // Gracefully fall back to deterministic scoring
    console.log(
      `OpenAI scoring failed: ${error.message}. Using deterministic fallback.`
    );
    const fallback = calculateFallbackScore(resumeText, jobText);
    return {
      ...fallback,
      source: "Fallback"
    };
  }
};

export const matchJobsWithResume = async ({ resumeText, jobs }) => {
  const scoredJobs = await Promise.all(
    jobs.map(async (job) => {
      const result = await scoreJobWithResume({
        resumeText,
        jobText: `${job.title} at ${job.company}. ${job.description}`,
      });
      return { ...job, match: result };
    })
  );
  return scoredJobs;
};