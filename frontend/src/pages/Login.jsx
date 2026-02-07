import { useEffect, useRef, useState } from "react";
import { login } from "../services/api.js";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("test@gmail.com");
  const [password, setPassword] = useState("test@123");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (window.location.hash === "#login-section") {
      emailInputRef.current?.focus();
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    setIsLoading(true);

    const result = await login({ email, password });
    if (result.ok) {
      setStatus("Login successful!");
      onLogin?.(email);
    } else {
      setStatus(result.message || "Invalid credentials");
    }
    setIsLoading(false);
  };

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="container landing-hero-inner">
          <div className="landing-hero-left">
            <div className="hero-badge">AI-Powered Job Tracking Platform</div>
            <h1 className="hero-title">
              Find Better Jobs.
              <br />
              Track Every Application.
              <br />
              Powered by AI.
            </h1>
            <p className="hero-subtitle">
              Start by logging in, then upload your resume to see AI-matched jobs.
            </p>
            <div className="hero-actions">
              <a
                className="btn primary hero-login"
                href="#login-section"
                onClick={() => setTimeout(() => document.getElementById("login-email")?.focus(), 0)}
              >
                Login to Get Started
              </a>
              <a className="btn secondary" href="#how-it-works">How it Works</a>
            </div>
          </div>
          <div className="landing-hero-right">
            <div className="hero-image-card">
              <img
                className="hero-illustration"
                src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80"
                alt="Job analytics dashboard preview"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="container how-it-works-inner">
          <div className="how-copy">
            <span className="section-eyebrow">How it works</span>
            <h2>From resume to ranked jobs in minutes</h2>
            <p>
              Upload your resume, we extract skills and experience, then score each job
              and rank results by fit. You can track every application from one dashboard.
            </p>
            <div className="how-steps">
              <div className="how-step">
                <div className="step-number">01</div>
                <div>
                  <h4>Resume Upload</h4>
                  <p>We parse your resume and store the text for AI matching.</p>
                </div>
              </div>
              <div className="how-step">
                <div className="step-number">02</div>
                <div>
                  <h4>AI Match Scoring</h4>
                  <p>Jobs are scored on skills, experience, and keyword alignment.</p>
                </div>
              </div>
              <div className="how-step">
                <div className="step-number">03</div>
                <div>
                  <h4>Track Applications</h4>
                  <p>Monitor status changes and keep your job search organized.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="how-visual">
            <div className="graph-card">
              <div className="graph-title">Match Score Distribution</div>
              <div className="graph-bars">
                <div className="bar-row">
                  <span>High</span>
                  <div className="bar-track"><div className="bar-fill high"></div></div>
                </div>
                <div className="bar-row">
                  <span>Medium</span>
                  <div className="bar-track"><div className="bar-fill medium"></div></div>
                </div>
                <div className="bar-row">
                  <span>Low</span>
                  <div className="bar-track"><div className="bar-fill low"></div></div>
                </div>
              </div>
            </div>
            <div className="graph-card">
              <div className="graph-title">Applications Over Time</div>
              <div className="sparkline">
                <span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Card */}
      <div className="login-container container" id="login-section">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue your job search</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                className="input modern-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Enter your email"
                disabled={isLoading}
                id="login-email"
                ref={emailInputRef}
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                className="input modern-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
            
            <button 
              className={`btn primary modern-btn ${isLoading ? 'loading' : ''}`} 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          {status && (
            <div className={`status-message ${status.includes('successful') ? 'success' : 'error'}`}>
              {status}
            </div>
          )}
          
          <div className="demo-hint">
            <p>Demo Credentials:</p>
            <p><strong>Email:</strong> test@gmail.com</p>
            <p><strong>Password:</strong> test@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
