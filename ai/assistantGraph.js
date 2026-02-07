import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StateGraph } from "@langchain/langgraph";
import { searchKnowledge } from "./knowledgeBase.js";

let model = null;

const DEFAULT_FILTERS = {
  role: "",
  skills: [],
  datePosted: "any",
  jobType: "",
  workMode: "",
  location: "",
  matchScore: "all",
};

function getModel() {
  if (!model) {
    model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
      temperature: 0.1,
    });
  }
  return model;
}

const mergeFilters = (current, next) => {
  const merged = { ...DEFAULT_FILTERS, ...(current || {}) };
  const incoming = next || {};

  Object.entries(incoming).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === "string" && value.trim() === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    if (key === "skills") {
      const existing = Array.isArray(merged.skills) ? merged.skills : [];
      const nextSkills = Array.isArray(value) ? value : [];
      merged.skills = Array.from(new Set([...existing, ...nextSkills]));
      return;
    }
    merged[key] = value;
  });

  return merged;
};

const summarizeFilters = (filters) => {
  const parts = [];
  if (filters.role) parts.push(filters.role);
  if (filters.location) parts.push(filters.location);
  if (filters.workMode) parts.push(filters.workMode);
  if (filters.jobType) parts.push(filters.jobType);
  if (filters.matchScore && filters.matchScore !== "all") {
    parts.push(filters.matchScore === "high" ? "High Match" : "Medium Match");
  }
  if (filters.datePosted && filters.datePosted !== "any") {
    parts.push(filters.datePosted === "24h" ? "Last 24h" : filters.datePosted === "week" ? "Last week" : "Last month");
  }
  return parts.length ? parts.join(" · ") : "Filters updated";
};

const ruleBasedIntent = (rawInput, currentFilters) => {
  const input = String(rawInput || "").toLowerCase();
  const filters = {};

  if (/clear|reset|remove all/.test(input) && /filter|filters/.test(input)) {
    return {
      intent: "reset_filters",
      filters: DEFAULT_FILTERS,
      response: "✔ Filters cleared.",
    };
  }

  if (/^(hi|hello|hey|good morning|good evening)\b/.test(input)) {
    return {
      intent: "product_help",
      filters: null,
      response: "Hi. What do you want to do?",
    };
  }

  if (/(remote|work from home)/.test(input)) filters.workMode = "remote";
  if (/hybrid/.test(input)) filters.workMode = "hybrid";
  if (/(on[- ]?site|onsite)/.test(input)) filters.workMode = "on-site";

  if (/resume|cv/.test(input)) {
    return {
      intent: "product_help",
      filters: null,
      response: "Share your role and experience level, and I can suggest resume improvements.",
    };
  }

  if (/cover letter/.test(input)) {
    return {
      intent: "product_help",
      filters: null,
      response: "Tell me the job title and company. I can draft a cover letter.",
    };
  }

  if (/interview/.test(input)) {
    return {
      intent: "product_help",
      filters: null,
      response: "Tell me the role and company. I can run interview practice questions.",
    };
  }

  if (/salary|compensation|negotiat/.test(input)) {
    return {
      intent: "product_help",
      filters: null,
      response: "Tell me the role, location, and experience level. I can suggest a salary range and negotiation tips.",
    };
  }

  if (/career|switch|transition/.test(input)) {
    return {
      intent: "product_help",
      filters: null,
      response: "Tell me your current role and target role. I can outline a transition plan.",
    };
  }

  if (/full[- ]?time/.test(input)) filters.jobType = "full-time";
  if (/part[- ]?time/.test(input)) filters.jobType = "part-time";
  if (/contract/.test(input)) filters.jobType = "contract";
  if (/intern(ship)?/.test(input)) filters.jobType = "internship";

  if (/past 24 hours|last 24h|today/.test(input)) filters.datePosted = "24h";
  if (/past week|last week/.test(input)) filters.datePosted = "week";
  if (/past month|last month/.test(input)) filters.datePosted = "month";

  if (/high match|top match/.test(input)) filters.matchScore = "high";
  if (/medium match/.test(input)) filters.matchScore = "medium";

  if (/react/.test(input)) filters.skills = ["react"];
  if (/python/.test(input)) filters.skills = ["python"];

  const roleMatch = input.match(/(react|python|frontend|backend|full[- ]?stack|data|ml|machine learning|devops|designer)\s+(developer|engineer|analyst|scientist)/);
  if (roleMatch?.[0]) filters.role = roleMatch[0].replace(/\s+/g, " ");

  const roleJobs = input.match(/(react|python|frontend|backend|full[- ]?stack|data analyst|ml engineer|machine learning engineer|devops)\s+(jobs|roles|positions)/);
  if (roleJobs?.[1]) filters.role = roleJobs[1].replace(/\s+/g, " ");

  const roleSetter = input.match(/(role|title)\s*(to|as)?\s*([a-zA-Z\s]+)$/);
  if (roleSetter?.[3]) filters.role = roleSetter[3].trim();

  const locationMatch = input.match(/location\s*[:=]?\s*([a-zA-Z\s]+)$/) || input.match(/in\s+([a-zA-Z\s]+)$/);
  if (locationMatch?.[1]) filters.location = locationMatch[1].trim();

  const hasFilters = Object.keys(filters).length > 0;
  
  // Check if it looks like a general question (not job-related)
  // This includes factual questions, definitions, explanations, etc.
  const isGeneralQuestion = 
    /^(what|who|when|where|why|how|explain|tell me|describe|define|which|whose|whom|is|are|do|does|can|could|should|would|will)/.test(input) &&
    !/(job|work|career|resume|salary|interview|company|position|role|apply|hiring|recruit|applicant|intern)/.test(input);
  
  // Also treat as general query if it's not a job-related phrase at all
  const isJobRelated = 
    /(job|work|career|resume|cv|interview|salary|compensation|application|apply|hiring|recruiter|position|role|experience|skill|company|employer|employee)/.test(input);
  
  // If it has no filters and is not explicitly job-related, treat as general query
  if ((isGeneralQuestion || !isJobRelated) && !hasFilters) {
    return {
      intent: "general_query",
      filters: null,
      response: "Let me answer that for you.",
    };
  }
  
  const merged = mergeFilters(currentFilters, filters);
  return {
    intent: hasFilters ? "update_filters" : "product_help",
    filters: hasFilters ? merged : null,
    response: hasFilters ? `✔ Filters updated: ${summarizeFilters(merged)}` : "I can help with jobs, resumes, interviews, cover letters, salary, and career plans.",
  };
};

const INTENT_PROMPT = new PromptTemplate({
  template: `You are an AI assistant that can answer any question.
Classify the user's intent into one of:
- update_filters (job search filters)
- search_jobs (job search)
- product_help (job platform help)
- general_query (general questions, world knowledge, anything else)

Return JSON only with keys:
intent (string),
filters (object or null),
response (string for user).

Rules:
- If the user asks to change filters, intent=update_filters and include filters.
- If the user is asking for job search constraints, intent=search_jobs and include filters.
- If the user asks about product usage, intent=product_help.
- Filters must follow this schema (all optional):
  role (string or null),
  skills (array of strings or null),
  datePosted ("24h" or "week" or "month" or "any" or null),
  jobType ("full-time" or "part-time" or "contract" or "internship" or null),
  workMode ("remote" or "hybrid" or "on-site" or null),
  location (string or null),
  matchScore ("high" or "medium" or "all" or null)

Important response rules:
- Respond with short, confident confirmations.
- Do not ask follow-up questions.
- If filters are updated, confirm what changed.

User message:
{input}

JSON only.`,
  inputVariables: ["input"],
});

const detectIntentNode = async (state) => {
  if (!process.env.OPENAI_API_KEY) {
    const fallback = ruleBasedIntent(state.input, state.currentFilters);
    return {
      ...state,
      intent: fallback.intent,
      response: "⚠️ AI temporarily unavailable — filters applied using fallback.",
      filters: fallback.filters,
    };
  }

  let response;
  try {
    const prompt = await INTENT_PROMPT.format({ input: state.input });
    response = await getModel().invoke(prompt);
  } catch (error) {
    const message = String(error?.message || "");
    const isQuota = /429|quota|rate limit/i.test(message);
    const isTimeout = /timeout|timed out/i.test(message);

    if (isQuota || isTimeout) {
      const fallback = ruleBasedIntent(state.input, state.currentFilters);
      return {
        ...state,
        intent: fallback.intent,
        response: "⚠️ AI temporarily unavailable — filters applied using fallback.",
        filters: fallback.filters,
      };
    }

    const fallback = ruleBasedIntent(state.input, state.currentFilters);
    return {
      ...state,
      intent: fallback.intent,
      response: "⚠️ AI temporarily unavailable — filters applied using fallback.",
      filters: fallback.filters,
    };
  }

  let content = response?.content || "{}";
  content = String(content)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    const parsed = JSON.parse(content);
    const intent = parsed.intent || (Object.keys(parsed.filters || {}).length ? "update_filters" : "product_help");
    if (intent === "reset_filters") {
      return {
        ...state,
        intent,
        filters: DEFAULT_FILTERS,
        response: "✔ Filters cleared.",
      };
    }

    const merged = mergeFilters(state.currentFilters, parsed.filters || null);
    return {
      ...state,
      intent,
      filters: merged,
      response: intent === "update_filters" || intent === "search_jobs"
        ? `✔ Filters updated: ${summarizeFilters(merged)}`
        : parsed.response || "",
    };
  } catch {
    return {
      ...state,
      intent: "product_help",
      filters: null,
      response: "I couldn't read that. Try again with a shorter request.",
    };
  }
};

const updateFiltersNode = async (state) => ({
  ...state,
  action: {
    type: "update_filters",
    filters: state.filters || {},
  },
  response: state.response || `✔ Filters updated: ${summarizeFilters(state.filters || {})}`,
});

const searchJobsNode = async (state) => ({
  ...state,
  action: {
    type: "search_jobs",
    filters: state.filters || {},
  },
  response: state.response || `✔ Filters updated: ${summarizeFilters(state.filters || {})}`,
});

const productHelpNode = async (state) => ({
  ...state,
  action: {
    type: "product_help",
  },
});

const resetFiltersNode = async (state) => ({
  ...state,
  action: {
    type: "reset_filters",
  },
  response: state.response || "✔ Filters cleared.",
});

const generalQueryNode = async (state) => {
  // Check knowledge base first
  const kbResults = searchKnowledge(state.input);
  if (kbResults.length > 0) {
    return {
      ...state,
      response: kbResults[0].answer,
      action: { type: "general_query" },
    };
  }

  // Fallback to OpenAI if no KB match
  if (!process.env.OPENAI_API_KEY) {
    return {
      ...state,
      response: "I can help with job searches, resumes, interviews, and career advice. Ask me about career topics!",
      action: { type: "general_query" },
    };
  }

  try {
    const prompt = `You are a helpful AI assistant. Answer this question clearly and concisely:\n\n${state.input}`;
    const aiResponse = await getModel().invoke(prompt);
    return {
      ...state,
      response: String(aiResponse?.content || "I couldn't generate a response."),
      action: { type: "general_query" },
    };
  } catch (error) {
    return {
      ...state,
      response: "⚠️ AI is temporarily busy — I can still help with filters and job search.",
      action: { type: "general_query" },
    };
  }
};

const graph = new StateGraph({
  channels: {
    input: { value: null },
    intent: { value: null },
    filters: { value: null },
    currentFilters: { value: null },
    response: { value: null },
    action: { value: null },
  },
});

graph.addNode("detect_intent", detectIntentNode);
graph.addNode("update_filters", updateFiltersNode);
graph.addNode("search_jobs", searchJobsNode);
graph.addNode("product_help", productHelpNode);
graph.addNode("reset_filters", resetFiltersNode);
graph.addNode("general_query", generalQueryNode);

graph.setEntryPoint("detect_intent");

graph.addConditionalEdges("detect_intent", (state) => {
  const intent = String(state.intent || "").toLowerCase();
  if (intent === "update_filters") return "update_filters";
  if (intent === "search_jobs") return "search_jobs";
  if (intent === "reset_filters") return "reset_filters";
  if (intent === "general_query") return "general_query";
  return "product_help";
});

graph.setFinishPoint("update_filters");
graph.setFinishPoint("search_jobs");
graph.setFinishPoint("product_help");
graph.setFinishPoint("reset_filters");
graph.setFinishPoint("general_query");

const app = graph.compile();

export const runAssistantGraph = async ({ input, currentFilters }) => {
  if (!process.env.OPENAI_API_KEY) {
    const fallback = ruleBasedIntent(input, currentFilters);
    const actionType =
      fallback.intent === "update_filters"
        ? "update_filters"
        : fallback.intent === "search_jobs"
          ? "search_jobs"
          : fallback.intent === "reset_filters"
            ? "reset_filters"
            : "product_help";

    return {
      message: fallback.response,
      action: actionType === "product_help" ? { type: "product_help" } : { type: actionType, filters: fallback.filters || {} },
      filters: fallback.filters || null,
    };
  }

  try {
    const result = await app.invoke({
      input: String(input || ""),
      intent: "",
      filters: null,
      currentFilters: currentFilters || DEFAULT_FILTERS,
      response: "",
      action: null,
    });

    return {
      message: String(result.response || ""),
      action: result.action,
      filters: result.filters || null,
    };
  } catch (error) {
    console.error("AI assistant error:", error);
    const fallback = ruleBasedIntent(input, currentFilters);
    const actionType =
      fallback.intent === "update_filters"
        ? "update_filters"
        : fallback.intent === "search_jobs"
          ? "search_jobs"
          : fallback.intent === "reset_filters"
            ? "reset_filters"
            : "product_help";
    return {
      message: "⚠️ AI is temporarily busy — applied filters using smart fallback.",
      action: actionType === "product_help" ? { type: "product_help" } : { type: actionType, filters: fallback.filters || {} },
      filters: fallback.filters || null,
    };
  }
};
