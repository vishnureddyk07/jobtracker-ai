const resumeStore = new Map();

export const getResumeFromStore = (email) => {
  if (!email) return null;
  return resumeStore.get(String(email).trim().toLowerCase()) || null;
};

export const setResumeInStore = (email, resume) => {
  if (!email) return;
  resumeStore.set(String(email).trim().toLowerCase(), resume);
};
