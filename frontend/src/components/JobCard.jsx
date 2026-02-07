export default function JobCard({ job, onApply, onViewDetails }) {
  const score = job?.match?.score ?? job?._matchScore ?? null;
  const isScored = typeof score === "number";
  const scoreLabel = isScored ? "AI" : "Not Scored";

  const badgeClass =
    !isScored ? "badge gray" : score > 70 ? "badge green" : score >= 40 ? "badge yellow" : "badge gray";

  const getScoreHint = (score) => {
    if (score > 70) return "Strong fit";
    if (score > 40) return "Partial fit";
    return "Low fit";
  };

  const getMatchExplanation = (job, score) => {
    const skills = job.skills || [];
    const matchingSkills = skills.slice(0, 3);
    const keywords = String(job.description || "")
      .toLowerCase()
      .match(/\b[a-z]{4,}\b/g) || [];
    const keywordSet = Array.from(new Set(keywords)).slice(0, 3);

    if (typeof score !== "number") {
      const source = matchingSkills.length > 0 ? matchingSkills : keywordSet;
      const label = source.length > 0 ? source.join(", ") : "job requirements";
      return [
        `Estimated (AI unavailable): based on ${label}`,
      ];
    }

    if (score > 70) {
      return [
        `Strong match with required skills: ${matchingSkills.join(", ")}`,
        "Experience level aligns with job requirements",
      ];
    } else if (score > 40) {
      return [
        `Some matching skills: ${matchingSkills.slice(0, 2).join(", ")}`,
        "Consider highlighting relevant experience",
      ];
    }
    return [
      "Limited skill overlap",
      "May require additional qualifications",
    ];
  };

  return (
    <div className="job-card">
      <div className="job-header">
        <div>
          <h3>{job.title}</h3>
          <p className="job-subtitle">
            {job.company} • {job.location}
          </p>
        </div>
        <div className="job-match-badge">
          <span className={badgeClass} title={isScored ? `AI-estimated match: ${getScoreHint(score)}` : "Not scored yet"}>
            {isScored ? `${score}%` : "Not Scored"} <span className="score-source">{scoreLabel}</span>
          </span>
          <span className="match-hint">{isScored ? getScoreHint(score) : "No AI score"}</span>
        </div>
      </div>

      <div className="job-meta">
        <span className="job-meta-item">Type: {job.jobType}</span>
        <span className="job-meta-item">Mode: {job.workMode}</span>
      </div>

      <p className="job-desc">{job.description}</p>

      {(job.match?.explanation || score !== null) && (
        <div className="job-match-explanation">
          <span className="match-label">Why this matches:</span>
          {job.match?.explanation ? (
            <p className="job-explain">{job.match.explanation}</p>
          ) : (
            <ul className="match-bullets">
              {getMatchExplanation(job, score).map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="job-actions">
        <button className="btn primary modern-btn" onClick={() => onApply(job)}>
          Apply Now
        </button>
        {onViewDetails && (
          <button className="btn secondary" onClick={onViewDetails}>
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
