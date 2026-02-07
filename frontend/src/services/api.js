const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const login = async ({ email, password }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

export const getResumeStatus = async ({ email }) => {
  try {
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(`${API_BASE_URL}/resume/${encodedEmail}`);
    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

export const uploadResume = async ({ email, file }) => {
  try {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("resume", file);

    const response = await fetch(`${API_BASE_URL}/resume`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

export const fetchJobs = async ({ search = "", location = "", email = "" } = {}) => {
  try {
    const url = new URL(`${API_BASE_URL}/jobs`);
    if (search) url.searchParams.set("search", search);
    if (location) url.searchParams.set("location", location);
    if (email) url.searchParams.set("email", email);
    url.searchParams.set("_ts", Date.now().toString());

    const response = await fetch(url.toString(), { cache: "no-store" });
    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

export const syncJobs = async ({ query, location, email }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, location, email }),
    });

    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

export const saveApplication = async ({
  email,
  jobId,
  jobTitle,
  company,
  appliedEarlier = false,
  appliedAt,
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        jobId,
        jobTitle,
        company,
        appliedEarlier,
        appliedAt,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

export const getApplications = async ({ email }) => {
  try {
    const url = new URL(`${API_BASE_URL}/applications`);
    url.searchParams.set("email", email);

    const response = await fetch(url.toString());
    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

export const updateApplicationStatus = async ({ appId, status }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/${appId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

export const askAssistant = async ({ input, currentFilters }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, currentFilters }),
    });

    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

// Additional API functions for ultra-modern design

export const loginUser = async (email, password) => {
  return login({ email, password });
};

export const registerUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return { ok: response.ok, ...data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

export const getUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Not authenticated');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    
    return { ok: response.ok };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

export const sendMessage = async (message) => {
  return askAssistant({ input: message });
};

export const getJobs = async (filters = {}) => {
  return fetchJobs(filters);
};
