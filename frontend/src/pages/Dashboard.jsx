import { useEffect, useState } from "react";
import { getApplications, updateApplicationStatus } from "../services/api.js";

const STATUS_OPTIONS = ["Applied", "Interview", "Offer", "Rejected"];
const STATUS_COLORS = {
  Applied: "#6366f1",
  Interview: "#f97316",
  Offer: "#16a34a",
  Rejected: "#ef4444",
};

export default function Dashboard({ email }) {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  // Calculate success rate
  const successRate = applications.length > 0
    ? Math.round((applications.filter(a => a.status === "Offer").length / applications.length) * 100)
    : 0;

  // Calculate interview rate
  const interviewRate = applications.length > 0
    ? Math.round((applications.filter(a => ["Interview", "Offer"].includes(a.status)).length / applications.length) * 100)
    : 0;

  const loadApplications = async () => {
    setIsLoading(true);
    const result = await getApplications({ email });
    if (result.ok) {
      setApplications(result.applications || []);
    } else {
      setStatus(result.message || "Failed to load applications");
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (appId, newStatus) => {
    const result = await updateApplicationStatus({ appId, status: newStatus });
    if (result.ok) {
      await loadApplications();
      setStatus("✅ Status updated!");
    } else {
      setStatus("❌ Failed to update status");
    }
  };

  const exportToCSV = () => {
    const headers = ["Job Title", "Company", "Status", "Applied Date", "Last Updated"];
    const rows = applications.map((app) => [
      app.jobTitle,
      app.company,
      app.status,
      new Date(app.appliedAt).toLocaleDateString(),
      app.timeline && app.timeline.length > 0
        ? new Date(app.timeline[app.timeline.length - 1].at).toLocaleDateString()
        : "-",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Calculate stats
  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === "Applied").length,
    interviews: applications.filter((a) => a.status === "Interview").length,
    offers: applications.filter((a) => a.status === "Offer").length,
    rejected: applications.filter((a) => a.status === "Rejected").length,
  };

  const buildTimeSeries = () => {
    const weeks = 6;
    const now = new Date();
    const series = [];

    for (let i = weeks - 1; i >= 0; i -= 1) {
      const start = new Date(now);
      start.setDate(now.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const count = applications.filter((app) => {
        const appliedAt = new Date(app.appliedAt);
        return appliedAt >= start && appliedAt <= end;
      }).length;

      series.push({
        label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: count,
      });
    }

    return series;
  };

  const timeSeries = buildTimeSeries();
  const maxValue = Math.max(1, ...timeSeries.map((d) => d.value));

  const buildPath = (data, height = 120, width = 300) => {
    const step = width / (data.length - 1 || 1);
    return data
      .map((d, i) => {
        const x = i * step;
        const y = height - (d.value / maxValue) * height;
        return `${i === 0 ? "M" : "L"} ${x},${y}`;
      })
      .join(" ");
  };

  const linePath = buildPath(timeSeries);
  const areaPath = `${linePath} L 300,120 L 0,120 Z`;

  return (
    <div className="dashboard">
      <div className="dashboard-overview">
        <div className="overview-header">
          <div>
            <h1>Application Overview</h1>
            <p>Track your job applications and hiring progress over time</p>
          </div>
          <button className="btn secondary" onClick={exportToCSV}>
            Export
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Total Applications</div>
            <div className="metric-value">{stats.total}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Interviews Scheduled</div>
            <div className="metric-value">{stats.interviews}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Offers Received</div>
            <div className="metric-value">{stats.offers}</div>
          </div>
        </div>
      </div>

      {status && (
        <div className="dashboard-status-message">
          {status}
        </div>
      )}

      {!isLoading && applications.length > 0 && (
        <div className="dashboard-charts">
          <div className="chart-card">
            <h3>Applications Over Time</h3>
            <svg viewBox="0 0 300 120" className="chart-svg" aria-hidden="true">
              <path d={areaPath} className="chart-area" />
              <path d={linePath} className="chart-line" />
            </svg>
            <div className="chart-axis">
              {timeSeries.map((d) => (
                <span key={d.label}>{d.label}</span>
              ))}
            </div>
          </div>
          <div className="chart-card">
            <h3>Application Status Distribution</h3>
            <div className="bar-chart">
              {[
                { label: "Applied", value: stats.applied },
                { label: "Interview", value: stats.interviews },
                { label: "Offer", value: stats.offers },
                { label: "Rejected", value: stats.rejected },
              ].map((item) => (
                <div key={item.label} className="bar-item">
                  <div className="bar-label">{item.label}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(item.value / Math.max(1, stats.total)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="bar-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="applications-skeleton">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="skeleton-card">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text short"></div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && applications.length === 0 ? (
        <div className="empty-state-premium">
          <div className="empty-state-icon" aria-hidden="true"></div>
          <h3 className="empty-state-title">No Applications Yet</h3>
          <p className="empty-state-text">
            Ready to start your job search? Browse open positions and apply to build your application timeline.
          </p>
          <a href="/jobs" className="btn primary modern-btn">
            Browse Jobs
          </a>
        </div>
      ) : !isLoading ? (
        <div className="applications-section-premium">
          <div className="section-header">
            <h2 className="section-title">Application Timeline</h2>
            <div className="view-options">
              <span className="view-count">{applications.length} Active</span>
            </div>
          </div>
          
          <div className="applications-list-premium">
            {applications.map((app) => (
              <div key={app._id} className="premium-application-card">
                <div className="app-card-header">
                  <div className="app-info-premium">
                    <h4 className="app-title-premium">{app.jobTitle}</h4>
                    <div className="app-company-info">
                      <span className="company-name">{app.company}</span>
                    </div>
                    <div className="app-date-info">
                      <span className="date-text">Applied: {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div
                    className={`status-badge-premium ${app.status.toLowerCase()}`}
                  >
                    {app.status}
                  </div>
                </div>

                {/* Timeline */}
                {app.timeline && app.timeline.length > 0 && (
                  <div className="timeline-premium">
                    <div className="timeline-title">
                      Progress History
                    </div>
                    <div className="timeline-items">
                      {app.timeline.map((entry, idx) => {
                        const isLatest = idx === app.timeline.length - 1;
                        return (
                          <div key={idx} className={`timeline-item-premium ${isLatest ? 'latest' : ''}`}>
                            <div className="timeline-dot-premium"></div>
                            <div className="timeline-line-premium"></div>
                            <div className="timeline-content-premium">
                              <span className="timeline-status">{entry.status}</span>
                              <span className="timeline-date">
                                {new Date(entry.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="app-actions-premium">
                  <div className="notes-section-premium">
                    {editingId === app._id ? (
                      <div className="notes-edit-area">
                        <textarea
                          className="notes-textarea-premium"
                          placeholder="Add notes about this application..."
                          value={notes[app._id] || ""}
                          onChange={(e) =>
                            setNotes({ ...notes, [app._id]: e.target.value })
                          }
                          rows="3"
                        />
                        <button
                          className="btn-premium-small"
                          onClick={() => setEditingId(null)}
                        >
                          💾 Save Note
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-notes"
                        onClick={() => setEditingId(app._id)}
                      >
                        {notes[app._id] ? "Edit Note" : "Add Note"}
                      </button>
                    )}
                  </div>

                  <div className="status-update-section">
                    <label className="status-update-label">
                      Update Status:
                    </label>
                    <select
                      className="status-select-premium"
                      value={app.status}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <p className="status-hint">Changes are saved automatically</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
