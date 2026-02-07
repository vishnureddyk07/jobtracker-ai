import { useContext, useEffect, useMemo, useState } from "react";
import Filters from "../components/Filters.jsx";
import JobCard from "../components/JobCard.jsx";
import ApplyPopup from "../components/ApplyPopup.jsx";
import JobDetailsModal from "../components/JobDetailsModal.jsx";
import { FilterContext } from "../context/FilterContext.jsx";
import { fetchJobs, saveApplication, syncJobs } from "../services/api.js";

const dateToDays = (date) => (Date.now() - date.getTime()) / 86400000;
const normalizeText = (value) => String(value || "").toLowerCase();

const deriveMatchScore = (job, filters) => {
  const base = 35;
  let score = base;
  const titleDesc = `${job.title || ""} ${job.description || ""}`.toLowerCase();

  if (filters.role && titleDesc.includes(normalizeText(filters.role))) {
    score += 30;
  }

  if (filters.location && normalizeText(job.location).includes(normalizeText(filters.location))) {
    score += 10;
  }

  if (filters.workMode && normalizeText(job.workMode) === normalizeText(filters.workMode)) {
    score += 10;
  }

  if (filters.jobType && normalizeText(job.jobType) === normalizeText(filters.jobType)) {
    score += 10;
  }

  if (Array.isArray(filters.skills) && filters.skills.length > 0) {
    const matches = filters.skills.filter((skill) =>
      titleDesc.includes(normalizeText(skill))
    ).length;
    score += Math.min(20, matches * 8);
  }

  return Math.min(95, Math.max(25, Math.round(score)));
};

const passesDateFilter = (postedAt, filter) => {
  if (!postedAt || filter === "any") return true;
  const days = dateToDays(new Date(postedAt));
  if (filter === "24h") return days <= 1;
  if (filter === "week") return days <= 7;
  if (filter === "month") return days <= 30;
  return true;
};

export default function JobFeed({ email }) {
  const { filters } = useContext(FilterContext);
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info"); // 'success', 'error', 'info'
  const [activeJob, setActiveJob] = useState(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [searchHistory, setSearchHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

  // Load initial jobs on mount
  useEffect(() => {
    loadJobs();
    loadSearchHistory();
  }, []);

  const loadSearchHistory = () => {
    const history = JSON.parse(localStorage.getItem("jobSearchHistory") || "[]");
    setSearchHistory(history.slice(0, 5));
  };

  const saveToSearchHistory = (query, location) => {
    const history = JSON.parse(localStorage.getItem("jobSearchHistory") || "[]");
    const newSearch = { query, location, timestamp: new Date().toISOString() };
    const updated = [newSearch, ...history.filter(s => !(s.query === query && s.location === location))].slice(0, 10);
    localStorage.setItem("jobSearchHistory", JSON.stringify(updated));
    setSearchHistory(updated.slice(0, 5));
  };

  const loadJobs = async () => {
      setIsLoading(true);
    setStatus("Loading jobs...");
    setStatusType("info");
    const result = await fetchJobs({
      search: filters.role,
      location: filters.location,
      email: email,
    });

    if (result.ok) {
      setJobs(result.jobs || []);
      setStatus("");
    } else {
      setStatus(result.message || "Failed to load jobs");
      setStatusType("error");
    }
      setIsLoading(false);
  };

  const handleSync = async () => {
    setStatus("Syncing jobs from the job portal...");
    setStatusType("info");
    setIsSyncing(true);
    setSyncProgress(30);

    const result = await syncJobs({
      query: filters.role || "developer",
      location: filters.location || "",
      email,
    });

    setSyncProgress(70);

    if (result.ok) {
      saveToSearchHistory(filters.role || "developer", filters.location || "");
      setStatus(`Successfully synced ${result.count || 0} jobs.`);
      setStatusType("success");
      setSyncProgress(100);
      setTimeout(() => loadJobs(), 500);
      setTimeout(() => setSyncProgress(0), 2000);
    } else {
      setStatus(`Sync failed: ${result.message || "Unknown error"}`);
      setStatusType("error");
    }

    setIsSyncing(false);
  };

  const jobsWithScores = useMemo(() => {
    return jobs.map((job) => {
      const resumeScore = job.match?.score;
      if (typeof resumeScore === "number") {
        return { ...job, _matchScore: resumeScore, _matchSource: "resume" };
      }
      return {
        ...job,
        _matchScore: null,
        _matchSource: "unscored",
      };
    });
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const role = normalizeText(filters.role);
    const location = normalizeText(filters.location);
    const skills = (filters.skills || []).map((skill) => normalizeText(skill));

    return jobsWithScores.filter((job) => {
      const jobText = `${job.title} ${job.description}`.toLowerCase();

      if (role && !jobText.includes(role)) return false;
      if (location && !normalizeText(job.location).includes(location)) return false;
      if (!passesDateFilter(job.postedAt, filters.datePosted)) return false;

      if (
        filters.jobType &&
        normalizeText(job.jobType) !== normalizeText(filters.jobType)
      ) {
        return false;
      }

      if (
        filters.workMode &&
        normalizeText(job.workMode) !== normalizeText(filters.workMode)
      ) {
        return false;
      }

      if (filters.matchScore === "high" && (job._matchScore ?? 0) <= 70) {
        return false;
      }
      if (
        filters.matchScore === "medium" &&
        ((job._matchScore ?? 0) < 40 || (job._matchScore ?? 0) > 70)
      ) {
        return false;
      }

      if (skills.length > 0) {
        const haystack = `${job.title} ${job.description}`.toLowerCase();
        const matches = skills.some((skill) => haystack.includes(skill));
        if (!matches) return false;
      }

      return true;
    });
  }, [jobsWithScores, filters]);

  const bestMatches = useMemo(() => {
    return [...filteredJobs]
      .filter((job) => typeof job._matchScore === "number")
      .sort((a, b) => (b._matchScore ?? 0) - (a._matchScore ?? 0))
      .slice(0, 6);
  }, [filteredJobs]);

  const handleApply = (job) => {
    // Set active job first to show the popup
    setActiveJob(job);
    
    // Then open the application URL
    if (job.applyUrl && job.applyUrl.trim()) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    } else {
      // Fallback: Search for the job on Google
      const searchQuery = encodeURIComponent(`${job.title} ${job.company} job apply`);
      window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank", "noopener,noreferrer");
    }
  };

  const handleApplyConfirm = async (action) => {
    if (!activeJob) return;

    if (action === "applied") {
      await saveApplication({
        email,
        jobId: activeJob._id,
        jobTitle: activeJob.title,
        company: activeJob.company,
      });
      setStatus("Application recorded.");
      setStatusType("success");
    }

    if (action === "earlier") {
      await saveApplication({
        email,
        jobId: activeJob._id,
        jobTitle: activeJob.title,
        company: activeJob.company,
        appliedEarlier: true,
      });
      setStatus("Application recorded.");
      setStatusType("success");
    }

    if (action === "browsing") {
      setStatus("");
    }

    setActiveJob(null);
  };

  const stats = {
    total: jobsWithScores.length,
    highMatch: jobsWithScores.filter((j) => (j._matchScore ?? 0) > 70).length,
    remote: jobsWithScores.filter((j) => j.workMode === "Remote").length,
  };

  return (
    <div className="job-feed">
      <div className="job-feed-content container">
      {/* Enhanced Header with Stats */}
      <div className="feed-header-enhanced">
        <div className="header-content">
          <h3>Job Feed</h3>
          <p className="header-subtitle">Jobs ranked using AI match score based on your resume</p>
        </div>

        {jobs.length > 0 && (
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-number" style={{ color: "#22c55e" }}>{stats.highMatch}</span>
              <span className="stat-label">High Match</span>
            </div>
            <div className="stat-item">
              <span className="stat-number" style={{ color: "#3b82f6" }}>{stats.remote}</span>
              <span className="stat-label">Remote</span>
            </div>
          </div>
        )}

        <div className="feed-actions">
          <button className="btn" onClick={loadJobs} disabled={isSyncing}>
            Refresh
          </button>
          <button
            className="btn primary"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? `Syncing... ${syncProgress}%` : "Sync Jobs"}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {syncProgress > 0 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${syncProgress}%` }}></div>
        </div>
      )}

      {/* Status Message with Color */}
      {status && (
        <div
          className={`status-message status-${statusType}`}
          style={{
            marginTop: 12,
            padding: "14px 16px",
            borderRadius: 10,
            background:
              statusType === "success"
                ? "#dcfce7"
                : statusType === "error"
                ? "#fee2e2"
                : "#f1f5f9",
            color:
              statusType === "success"
                ? "#166534"
                : statusType === "error"
                ? "#991b1b"
                : "#475569",
            fontWeight: 500,
          }}
        >
          {status}
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && jobs.length === 0 && (
        <div className="search-history">
          <h4>Recent Searches</h4>
          <div className="history-list">
            {searchHistory.map((item, idx) => (
              <button key={idx} className="history-item">
                {item.query} {item.location && `in ${item.location}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <Filters />

      <div className="match-legend">
        <span className="legend-title">Match Score Guide:</span>
        <div className="legend-items">
          <span className="legend-item">
            <span className="legend-dot strong"></span> Strong fit
          </span>
          <span className="legend-item">
            <span className="legend-dot partial"></span> Partial fit
          </span>
          <span className="legend-item">
            <span className="legend-dot low"></span> Low fit
          </span>
        </div>
        <span className="legend-note">AI-estimated match between your resume and job requirements</span>
      </div>

      {isLoading && (
        <div className="job-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="skeleton-card">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text short"></div>
              <div className="skeleton skeleton-text"></div>
            </div>
          ))}
        </div>
      )}

      {jobs.length === 0 && !status && !isLoading && (
        <div className="empty-state-feed">
          <div className="empty-icon" aria-hidden="true"></div>
          <h3>No Jobs Yet</h3>
          <p>Click “Sync Jobs” to fetch opportunities from our job database.</p>
          <button className="btn primary modern-btn" onClick={handleSync}>
            Sync Jobs Now
          </button>
        </div>
      )}

      {jobs.length > 0 && filteredJobs.length === 0 && !isLoading && (
        <div className="empty-state-feed">
          <div className="empty-icon" aria-hidden="true"></div>
          <h3>No Matching Jobs</h3>
          <p>Try adjusting your filters to see more opportunities.</p>
          <button className="btn secondary" onClick={() => window.location.reload()}>
            Clear Filters
          </button>
        </div>
      )}

      {jobs.length > 0 && !isLoading && (
        <>
          {bestMatches.length > 0 && (
            <section className="best-matches-section">
              <div className="section-header-info">
                <h4 className="section-title-main">Best Matches ({bestMatches.length})</h4>
                <p className="section-description">
                  Jobs that best match your resume based on skills, experience, and requirements
                </p>
              </div>
              <div className="job-grid">
                {bestMatches.map((job) => (
                  <JobCard 
                    key={job._id} 
                    job={job} 
                    onApply={handleApply}
                    onViewDetails={() => setSelectedJobDetails(job)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="all-jobs-section">
            <div className="section-header-info">
              <h4 className="section-title-main">
                All Jobs ({filteredJobs.length})
              </h4>
              {filteredJobs.length > 0 && (
                <p className="section-description">
                  Showing all available positions matching your criteria
                </p>
              )}
            </div>
            {filteredJobs.length === 0 ? (
              <div className="empty-state-inline">
                <p>No jobs match your current filters. Try adjusting them or clearing all filters.</p>
              </div>
            ) : (
              <div className="job-grid">
                {filteredJobs.map((job) => (
                  <JobCard 
                    key={job._id} 
                    job={job} 
                    onApply={handleApply}
                    onViewDetails={() => setSelectedJobDetails(job)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <ApplyPopup
        job={activeJob}
        onClose={() => setActiveJob(null)}
        onConfirm={handleApplyConfirm}
      />

      {selectedJobDetails && (
        <JobDetailsModal
          job={selectedJobDetails}
          onClose={() => setSelectedJobDetails(null)}
          onApply={handleApply}
        />
      )}
      </div>
    </div>
  );
}
