import { createContext, useMemo, useState } from "react";

export const FilterContext = createContext(null);

const defaultFilters = {
  role: "",
  skills: [],
  datePosted: "any",
  jobType: "",
  workMode: "",
  location: "",
  matchScore: "all",
};

const FILTERS_STORAGE_KEY = "jobtracker.filters";

const loadStoredFilters = () => {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return defaultFilters;
    const parsed = JSON.parse(raw);
    return { ...defaultFilters, ...(parsed || {}) };
  } catch {
    return defaultFilters;
  }
};

const persistFilters = (filters) => {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // ignore storage errors
  }
};

export function FilterProvider({ children }) {
  const [filters, setFiltersState] = useState(loadStoredFilters);
  const [aiUpdate, setAiUpdate] = useState(null);

  const setFilters = (next) => {
    setAiUpdate(null);
    setFiltersState(next);
    persistFilters(next);
  };

  const setFiltersFromAI = (next, summary = "") => {
    setFiltersState((prev) => {
      const updated = { ...prev, ...next };
      persistFilters(updated);
      return updated;
    });
    setAiUpdate({
      summary,
      at: Date.now(),
    });
  };

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      setFiltersFromAI,
      aiUpdate,
      resetFilters: () => {
        setAiUpdate(null);
        setFiltersState(defaultFilters);
        persistFilters(defaultFilters);
      },
    }),
    [filters, aiUpdate]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}
