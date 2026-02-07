import { useEffect, useMemo, useState } from "react";
import { getResumeStatus, uploadResume } from "../services/api.js";

const MAX_PREVIEW_CHARS = 1200;

export default function ResumeUpload({ email, onUploaded, onNavigateToJobs, onResumeUpdated }) {
  const [status, setStatus] = useState("");
  const [resumeMeta, setResumeMeta] = useState(null);
  const [preview, setPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const displayName = useMemo(() => {
    if (!resumeMeta?.originalName) return "No resume uploaded";
    return resumeMeta.originalName;
  }, [resumeMeta]);

  const loadStatus = async () => {
    const result = await getResumeStatus({ email });
    if (result.ok) {
      setResumeMeta(result);
      setStatus("");
    } else {
      setResumeMeta(null);
      setStatus("");
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const processFile = async (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|docx|doc)$/i)) {
      setStatus("Please upload a PDF, TXT, DOC, or DOCX file");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading and analyzing your resume...");

    const result = await uploadResume({ email, file });
    if (result.ok) {
      setStatus("Resume uploaded successfully.");
      await loadStatus();
      resetFileInput();
      onResumeUpdated?.();
      setTimeout(() => {
        onUploaded?.();
      }, 1500);
    } else {
      setStatus(result.message || "Upload failed");
      resetFileInput();
    }

    setIsUploading(false);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    await processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    await processFile(file);
  };

  const handleReplaceClick = () => {
    // Trigger file input click
    document.getElementById("resume-file")?.click();
  };

  const resetFileInput = () => {
    // Reset file input by changing key, allowing same file to be selected again
    setFileInputKey(prev => prev + 1);
  };

  return (
    <div className="app-shell">
      <div className="resume-upload-container">
        <div className="resume-header">
          <h1>Resume & Profile</h1>
          <p>Your resume powers AI job matching</p>
        </div>

        {/* Current Resume Display */}
        {resumeMeta && !isUploading && (
          <div className="resume-status-card">
            <div className="resume-status">
              <div className="resume-status-indicator">Resume Uploaded</div>
              <div className="resume-meta">
                <p className="resume-name">{displayName}</p>
                <p className="upload-date">
                  Uploaded {new Date(resumeMeta.uploadedAt || Date.now()).toLocaleDateString()}
                </p>
                <p className="resume-formats">Supported: PDF, DOC, DOCX, TXT (Max 10MB)</p>
              </div>
            </div>
            <div className="resume-actions">
              <button 
                className="btn primary modern-btn" 
                onClick={() => {
                  onNavigateToJobs?.();
                }}
              >
                Find Matching Jobs
              </button>
              <button 
                className="btn secondary"
                onClick={handleReplaceClick}
              >
                Replace Resume
              </button>
            </div>
          </div>
        )}

        {!resumeMeta && (
          <div 
            className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="upload-progress">
                <div className="spinner-large"></div>
                <p className="upload-analyzing-text">Analyzing your resume...</p>
                <p className="upload-analyzing-subtext">Extracting skills, experience, and qualifications</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">Upload</div>
                <h3>Drag & drop your resume</h3>
                <p className="upload-hint">or browse to select a file</p>
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleUpload}
                  className="upload-input"
                  id="resume-file"
                  key={fileInputKey}
                  disabled={isUploading}
                />
                <label htmlFor="resume-file" className="upload-button">
                  Choose Resume
                </label>
                <p className="upload-formats">
                  Supported: PDF, DOC, DOCX, TXT (Max 10MB)
                </p>
              </>
            )}
          </div>
        )}

        {/* Status Messages */}
        {status && (
          <div className={`upload-status ${status.includes('failed') || status.includes('Please') ? 'error' : 'info'}`}>
            <div className="status-content">
              {status}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="resume-help">
          Your resume is used to calculate match scores and rankings.
        </div>
      </div>
    </div>
  );
}
