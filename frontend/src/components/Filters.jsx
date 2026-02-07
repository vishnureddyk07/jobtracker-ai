import { useContext, useState } from "react";
import { FilterContext } from "../context/FilterContext.jsx";

export default function Filters() {
  const { filters, setFilters, resetFilters, aiUpdate } = useContext(FilterContext);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = (event) => {
    event.preventDefault();
    const next = skillInput.trim();
    if (!next) return;

    const updated = Array.from(new Set([...(filters.skills || []), next]));
    setFilters({ ...filters, skills: updated });
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    const updated = (filters.skills || []).filter((item) => item !== skill);
    setFilters({ ...filters, skills: updated });
  };

  return (
    <div className="card filters">
      {/* Chat Hint Banner */}
      <div className="ai-hint-banner">
        <span className="ai-icon">AI</span>
        <div>
          <strong>Smart Filters:</strong> Filters can be applied manually or using the AI assistant.
          <br />
          <span className="hint-examples">Try: "Show me remote React jobs" or "Full-time Python roles"</span>
        </div>
      </div>

      {aiUpdate && (
        <div className="ai-filter-indicator">
          <span className="ai-indicator-icon">✔</span>
          <span className="ai-indicator-text">Filters updated by AI: {aiUpdate.summary}</span>
        </div>
      )}

      <div className="filter-grid">
        <div className="filter-group">
          <h5>Role & Location</h5>
          <div>
            <label>Role / Title</label>
            <input
              className="input"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              placeholder="e.g. React Developer"
            />
          </div>
          <div>
            <label>Location</label>
            <input
              className="input"
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
              placeholder="City or region"
            />
          </div>
        </div>

        <div className="filter-group">
          <h5>Type & Mode</h5>
          <div>
            <label>Job type</label>
            <select
              className="input"
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
            >
              <option value="">All</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div>
            <label>Work mode</label>
            <select
              className="input"
              value={filters.workMode}
              onChange={(e) => setFilters({ ...filters, workMode: e.target.value })}
            >
              <option value="">All</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on-site">On-site</option>
            </select>
          </div>
        </div>

        <div className="filter-group">
          <h5>Match & Date</h5>
          <div>
            <label>Match score</label>
            <select
              className="input"
              value={filters.matchScore}
              onChange={(e) =>
                setFilters({ ...filters, matchScore: e.target.value })
              }
            >
              <option value="all">All</option>
              <option value="high">High (&gt;70%)</option>
              <option value="medium">Medium (40–70%)</option>
            </select>
            <small className="helper-text">AI-estimated match between your resume and job requirements</small>
          </div>
          <div>
            <label>Date posted</label>
            <select
              className="input"
              value={filters.datePosted}
              onChange={(e) =>
                setFilters({ ...filters, datePosted: e.target.value })
              }
            >
              <option value="24h">Last 24 hours</option>
              <option value="week">Last week</option>
              <option value="month">Last month</option>
              <option value="any">Any time</option>
            </select>
          </div>
        </div>
      </div>

      <div className="skills-row">
        <label>Skills (multi-select)</label>
        <div className="skills-input">
          <input
            className="input"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Type a skill and press Add"
          />
          <button className="btn" onClick={addSkill}>
            Add
          </button>
        </div>
        <div className="skills-list">
          {(filters.skills || []).map((skill) => (
            <span key={skill} className="skill-chip">
              {skill}
              <button type="button" onClick={() => removeSkill(skill)}>
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="filter-actions">
        <button className="btn" onClick={resetFilters}>
          Clear all filters
        </button>
      </div>
    </div>
  );
}
