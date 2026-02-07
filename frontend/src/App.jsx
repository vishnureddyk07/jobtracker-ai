import { useEffect, useState } from "react";
import { FilterProvider } from "./context/FilterContext.jsx";
import { getResumeStatus, syncJobs } from "./services/api.js";
import Login from "./pages/Login.jsx";
import ResumeUpload from "./pages/ResumeUpload.jsx";
import JobFeed from "./pages/JobFeed.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ChatAssistant from "./components/ChatAssistant.jsx";

export default function App() {
  const [email, setEmail] = useState("");
  const [resumeReady, setResumeReady] = useState(false);
  const [view, setView] = useState("jobs");
  const [autoSyncDone, setAutoSyncDone] = useState(false);
  const [resumeUpdatedAt, setResumeUpdatedAt] = useState(Date.now());
  const displayName = email ? email.split("@")[0] : "";

  useEffect(() => {
    const checkResume = async () => {
      if (!email) return;
      const result = await getResumeStatus({ email });
      setResumeReady(result.ok);
    };

    checkResume();
  }, [email]);

  // Auto-sync jobs after resume is uploaded
  useEffect(() => {
    const autoSyncJobs = async () => {
      if (resumeReady && !autoSyncDone && email) {
        console.log("🤖 Auto-syncing jobs after resume upload...");
        try {
          await syncJobs({
            query: "developer",
            location: "",
            email,
          });
          console.log("✅ Auto-sync completed");
        } catch (error) {
          console.error("Auto-sync failed:", error);
        }
        setAutoSyncDone(true);
      }
    };

    autoSyncJobs();
  }, [resumeReady, autoSyncDone, email, resumeUpdatedAt]);

  if (!email) {
    return <Login onLogin={(userEmail) => setEmail(userEmail)} />;
  }

  if (!resumeReady) {
    return (
      <ResumeUpload
        email={email}
        onUploaded={() => setResumeReady(true)}
        onNavigateToJobs={() => {
          setResumeReady(true);
          setView("jobs");
        }}
        onResumeUpdated={() => {
          setResumeUpdatedAt(Date.now());
          setAutoSyncDone(false);
        }}
      />
    );
  }

  return (
    <FilterProvider>
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-inner container">
            <div className="brand">
              <span className="brand-name">JobTracker</span>
              <span className="brand-placeholder">(Company Logo)</span>
            </div>
            <nav className="nav-actions">
              <button
                className={`nav-btn ${view === "jobs" ? "active" : ""}`}
                onClick={() => setView("jobs")}
              >
                Jobs
              </button>
              <button
                className={`nav-btn ${view === "dashboard" ? "active" : ""}`}
                onClick={() => setView("dashboard")}
              >
                Dashboard
              </button>
              <button
                className={`nav-btn ${view === "resume" ? "active" : ""}`}
                onClick={() => setView("resume")}
              >
                Resume
              </button>
            </nav>
          </div>
        </header>

        {view === "jobs" && (
          <>
            <section className="post-login-hero">
              <div className="hero-container container">
                <div className="hero-left">
                  <span className="hero-pill">AI-Powered Job Tracking Platform</span>
                  <h1>
                    Smarter Job Search.
                    <br />
                    Better Matches.
                    <br />
                    Faster Decisions.
                  </h1>
                  <p>
                    Upload your resume, let AI match you with relevant jobs,
                    and track every application in one place.
                  </p>
                  <div className="hero-actions">
                    <button className="btn primary" onClick={() => setView("jobs")}>Explore Jobs</button>
                    <button className="btn secondary" onClick={() => setView("dashboard")}>View Dashboard</button>
                  </div>
                </div>
                <div className="hero-right">
                  <div className="hero-mockup">
                    <div className="mockup-card">
                      <div className="mockup-header">
                        <div>
                          <div className="mockup-title">Frontend Engineer</div>
                          <div className="mockup-company">Flipkart • Bangalore</div>
                        </div>
                        <span className="mockup-badge strong">82% Match</span>
                      </div>
                      <div className="mockup-skills">
                        Matched skills: React, TypeScript, UI Engineering
                      </div>
                    </div>
                    <div className="mockup-analytics">
                      <div className="analytics-item">
                        <div className="analytics-label">Applications Tracked</div>
                        <div className="analytics-value">12</div>
                      </div>
                      <div className="analytics-item">
                        <div className="analytics-label">Interviews</div>
                        <div className="analytics-value">3</div>
                      </div>
                      <div className="analytics-item">
                        <div className="analytics-label">Match Score</div>
                        <div className="analytics-value">High</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <div className="hero-divider"></div>
            <JobFeed email={email} />
          </>
        )}
        {view === "dashboard" && <Dashboard email={email} />}
        {view === "resume" && (
          <ResumeUpload
            email={email}
            onUploaded={() => setResumeReady(true)}
            onNavigateToJobs={() => setView("jobs")}
            onResumeUpdated={() => {
              setResumeUpdatedAt(Date.now());
              setAutoSyncDone(false);
            }}
          />
        )}

        <ChatAssistant email={email} />
      </div>
    </FilterProvider>
  );
}
