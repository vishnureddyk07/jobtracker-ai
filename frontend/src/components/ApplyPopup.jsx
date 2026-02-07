export default function ApplyPopup({ job, onClose, onConfirm }) {
  if (!job) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h3>Did you apply?</h3>
        <p>
          Did you apply to {job.title} at {job.company}?
        </p>
        <div className="popup-actions">
          <button className="btn primary" onClick={() => onConfirm("applied")}>
            Yes, Applied
          </button>
          <button className="btn" onClick={() => onConfirm("browsing")}
          >
            No, just browsing
          </button>
          <button className="btn" onClick={() => onConfirm("earlier")}
          >
            Applied Earlier
          </button>
        </div>
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
