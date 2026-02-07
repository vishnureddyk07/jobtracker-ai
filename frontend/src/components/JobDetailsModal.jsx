import React from "react";

export default function JobDetailsModal({ job, onClose, onApply }) {
  if (!job) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>{job.title}</h2>
            <p className="modal-company">{job.company}</p>
          </div>
          <div className="match-score-wrapper">
            <span
              style={{
                background: "#667eea",
                color: "white",
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {job.match?.score || 0}% Match
            </span>
            <small className="match-helper-text">
              AI-estimated match between your resume and job requirements
            </small>
          </div>
        </div>

        {/* Quick Info */}
        <div className="modal-info-grid">
          <div className="info-item">
            <span className="info-label">Location</span>
            <span className="info-value">{job.location}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Job Type</span>
            <span className="info-value">{job.jobType}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Work Mode</span>
            <span className="info-value">{job.workMode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Posted</span>
            <span className="info-value">
              {job.postedAt
                ? new Date(job.postedAt).toLocaleDateString()
                : "Unknown"}
            </span>
          </div>
        </div>

        {/* Match Score Reason */}
        {job.match?.reasoning && (
          <div className="match-reasoning">
            <h4>✨ Why this match?</h4>
            <p>{job.match.reasoning}</p>
          </div>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="modal-section">
            <h4>Required Skills</h4>
            <div className="skills-list">
              {job.skills.map((skill, idx) => (
                <span key={idx} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="modal-section">
          <h4>Job Description</h4>
          <div className="description-text">
            {job.description.substring(0, 500)}
            {job.description.length > 500 && "..."}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Close
          </button>
          <button
            className="btn primary"
            onClick={() => onApply(job)}
          >
            Apply Now
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          padding: 24px;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 24px;
        
          .match-score-wrapper {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
          }
        
          .match-helper-text {
            font-size: 11px;
            color: #64748b;
            text-align: right;
            max-width: 180px;
          }
          cursor: pointer;
          color: #6b7280;
          hover: { color: #111 };
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          gap: 16px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          color: #111827;
        }

        .modal-company {
          margin: 4px 0 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .modal-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
        }

        .info-value {
          font-size: 14px;
          color: #111827;
          font-weight: 500;
        }

        .match-reasoning {
          padding: 16px;
          background: #f0f9ff;
          border-left: 4px solid #3b82f6;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .match-reasoning h4 {
          margin: 0 0 8px 0;
          color: #1e40af;
          font-size: 14px;
        }

        .match-reasoning p {
          margin: 0;
          color: #1e40af;
          font-size: 13px;
          line-height: 1.5;
        }

        .modal-section {
          margin-bottom: 20px;
        }

        .modal-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-tag {
          background: #dbeafe;
          color: #1e40af;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .description-text {
          color: #4b5563;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .modal-actions .btn {
          flex: 1;
        }

        @media (max-width: 640px) {
          .modal-content {
            max-height: 90vh;
            padding: 16px;
          }

          .modal-header {
            flex-direction: column;
          }

          .modal-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
