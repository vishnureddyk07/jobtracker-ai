import { useContext, useEffect, useRef, useState } from "react";
import { FilterContext } from "../context/FilterContext.jsx";
import { askAssistant, getApplications, getResumeStatus } from "../services/api.js";

const QUICK_REPLIES = [
  { text: "Show me remote jobs 🏠", query: "remote jobs" },
  { text: "High match jobs only 🎯", query: "high match score jobs" },
  { text: "React developer roles 💻", query: "React developer jobs" },
  { text: "Python positions 🐍", query: "Python developer jobs" },
  { text: "Clear all filters ✨", query: "clear filters" },
];

const TYPING_MESSAGES = [
  "Searching through opportunities...",
  "Let me find that for you...",
  "One moment please...",
  "Looking into it...",
];

const formatAssistantResponse = (message, prompt) => {
  if (!message) return message;
  const needsDetail = /(how|why|explain|details|reason)/i.test(prompt);
  if (needsDetail || message.length < 240) return message;

  const sentences = message.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 2).join(" ").trim();
};

export default function ChatAssistant({ email }) {
  const { filters, setFilters, setFiltersFromAI, resetFilters } = useContext(FilterContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const applyFilterAction = (action) => {
    if (!action) return;

    let systemMessage = null;

    if (action.type === "update_filters") {
      const filters = action.filters || {};

      // Create system message showing what was changed
      const parts = [];
      if (filters.workMode) parts.push(filters.workMode);
      if (filters.jobType) parts.push(filters.jobType);
      if (filters.matchScore) parts.push(filters.matchScore === "high" ? "High Match" : "Medium Match");
      if (filters.role) parts.push(`"${filters.role}"`);

      const summary = parts.length > 0 ? parts.join(" · ") : "Filters updated";
      setFiltersFromAI(filters, summary);

      systemMessage = {
        role: "system",
        content: `✔ Filters updated: ${summary}`,
        timestamp: new Date().toISOString(),
      };
    } else if (action.type === "search_jobs") {
      const filters = action.filters || {};

      const parts = [];
      if (filters.role) parts.push(`Role: "${filters.role}"`);
      if (filters.location) parts.push(`Location: "${filters.location}"`);

      const summary = parts.length > 0 ? parts.join(" · ") : "Search updated";
      setFiltersFromAI(filters, summary);

      systemMessage = {
        role: "system",
        content: `✔ Searching: ${summary}`,
        timestamp: new Date().toISOString(),
      };
    } else if (action.type === "reset_filters") {
      resetFilters();
      systemMessage = {
        role: "system",
        content: "✔ All filters cleared",
        timestamp: new Date().toISOString(),
      };
    }

    if (systemMessage) {
      setMessages((prev) => [...prev, systemMessage]);
    }
  };

  const simulateTyping = () => {
    const randomMsg = TYPING_MESSAGES[Math.floor(Math.random() * TYPING_MESSAGES.length)];
    setTypingText(randomMsg);
    setIsTyping(true);
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const userMsg = { 
      role: "user", 
      content: text,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setShowQuickReplies(false);
    simulateTyping();

    // Simulate network delay for human feel
    await new Promise(resolve => setTimeout(resolve, 800));

    const normalized = text.toLowerCase();
    const isApplicationsCountQuery =
      /(how|many|meny|number|count|total).*(apply|applied|application|applications)/.test(normalized) ||
      /(application|applications).*(count|total|did i apply|did i applied|how many|meny|status)/.test(normalized) ||
      /^(how\s+many|count\s+my|total|number\s+of)\s+(application|applications|jobs?\s+(?:i\s+)?applied)/.test(normalized);

    const isSalaryQuery =
      /(salary|salery|pay|compensation|earn|earning|wage|income).*(resume|resue|my|based on|according to|what could be|estimate)/.test(normalized) ||
      /(according to|based on|my).*(resume|resue).*(salary|salery|pay|compensation|what could be)/.test(normalized);

    const isResumeTechQuery =
      /(tech|technology|technologies|skill|skills|stack).*(resume|resue|my|in my)/.test(normalized) ||
      /(what are|list|show|tell me).*(tech|technology|skill|skills|stack)/.test(normalized);

    const isCoverLetterQuery =
      /(cover letter|coverletter|coverleeter|coverleetr|cover leeter|application letter|letter)/.test(normalized) &&
      (/(for|at|in|to).*(company|position|role|job)/.test(normalized) || /\w+\s+(company|google|amazon|microsoft|meta|apple)/.test(normalized));

    const isInterviewQuery =
      /(interview|questions|preparation|prep|practice).*(for|at|in).*(role|position|job|company)/.test(normalized) ||
      /(interview|questions).*(\w+)\s+(role|position|engineer|developer)/.test(normalized);

    const isJobStatusQuery =
      /(job|application|applications).*(status|sts|state|progress)/.test(normalized) ||
      /(status|sts|progress).*(job|application|applications)/.test(normalized);

    const isTechQuestionsQuery =
      /(more|extra|additional)?\s*(tech|technical|coding).*(question|questions)/.test(normalized) ||
      /ask\s+more\s+tech\s+questions/.test(normalized);

    if (isApplicationsCountQuery) {
      setIsTyping(false);
      if (!email) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Please sign in first so I can check your applications.",
            timestamp: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      const appsResult = await getApplications({ email });
      if (appsResult.ok) {
        const count = (appsResult.applications || []).length;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `You applied to ${count} job${count === 1 ? "" : "s"}.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Couldn't fetch your applications right now.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      setIsLoading(false);
      return;
    }

    if (isJobStatusQuery) {
      setIsTyping(false);
      if (!email) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Please sign in first so I can check your job status.",
            timestamp: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      const appsResult = await getApplications({ email });
      if (appsResult.ok) {
        const apps = appsResult.applications || [];
        if (apps.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "No applications found yet.",
              timestamp: new Date().toISOString(),
            },
          ]);
        } else {
          const statusCounts = apps.reduce((acc, app) => {
            const key = app.status || "Applied";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          const summary = Object.entries(statusCounts)
            .map(([status, count]) => `${status}: ${count}`)
            .join(", ");

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Your application status: ${summary}.`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Couldn't fetch your application status right now.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      setIsLoading(false);
      return;
    }

    if (isTechQuestionsQuery) {
      setIsTyping(false);
      const questions = [
        "1. Explain the difference between REST and GraphQL.",
        "2. What is a closure in JavaScript?",
        "3. How does indexing improve database performance?",
        "4. Describe the event loop in Node.js.",
        "5. What are the SOLID principles?",
        "6. Explain CI/CD and why it matters.",
        "7. What is the difference between HTTP and HTTPS?",
        "8. How would you optimize a slow web page?",
        "9. Explain caching strategies in web apps.",
        "10. What is a race condition and how do you prevent it?"
      ];

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Here are more technical questions:\n\n${questions.join("\n")}`,
          timestamp: new Date().toISOString(),
        },
      ]);

      setIsLoading(false);
      return;
    }

    if (isSalaryQuery) {
      setIsTyping(false);
      if (!email) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Please sign in first so I can analyze your resume.",
            timestamp: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      const resumeResult = await getResumeStatus({ email });
      if (resumeResult.ok) {
        // Simple salary estimation based on common roles
        const resumeText = (resumeResult.originalName || "").toLowerCase();
        let salaryRange = "$50K-$70K";
        let role = "Entry Level";

        if (/senior|lead|principal|architect/.test(resumeText)) {
          salaryRange = "$120K-$180K";
          role = "Senior";
        } else if (/mid|intermediate|3-5 years/.test(resumeText)) {
          salaryRange = "$80K-$110K";
          role = "Mid Level";
        } else if (/junior|jr|1-2 years/.test(resumeText)) {
          salaryRange = "$60K-$80K";
          role = "Junior";
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Based on your resume, estimated salary range: ${salaryRange} for ${role} positions. This varies by location and company size.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Please upload your resume first so I can estimate salary.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      setIsLoading(false);
      return;
    }

    if (isResumeTechQuery) {
      setIsTyping(false);
      if (!email) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Please sign in and upload your resume first.",
            timestamp: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      const resumeResult = await getResumeStatus({ email });
      if (resumeResult.ok && resumeResult.originalName) {
        const commonTechs = ['React', 'Node.js', 'Python', 'Java', 'JavaScript', 'TypeScript', 'MongoDB', 'SQL', 'AWS', 'Docker', 'Kubernetes', 'Git'];
        const fileName = resumeResult.originalName.toLowerCase();
        const detectedTechs = commonTechs.filter(tech => fileName.includes(tech.toLowerCase()));
        
        if (detectedTechs.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Technologies in your resume: ${detectedTechs.join(', ')}. Upload a new resume to update the analysis.`,
              timestamp: new Date().toISOString(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Common technologies: JavaScript, Python, React, Node.js, SQL, AWS, Docker, Git. Add these to your resume based on your skills.",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Please upload your resume first so I can analyze it.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      setIsLoading(false);
      return;
    }

    if (isCoverLetterQuery) {
      setIsTyping(false);
      const jobMatch = text.match(/(?:for|at|in|to)?\s*(sde|sde1|sde 1|software engineer|frontend|backend|full[- ]?stack|data scientist|devops|ml engineer|product manager)/i);
      const companyMatch = text.match(/(?:at|in|for|to)?\s*(google|amazon|microsoft|meta|apple|netflix|uber|airbnb|\w+\s+company)/i);
      
      const jobTitle = jobMatch ? jobMatch[1] : "Software Engineer";
      const company = companyMatch ? companyMatch[1].replace(/\s+company$/i, '') : "the company";

      const coverLetter = `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} position at ${company}. With my strong technical background and passion for innovation, I am confident I can contribute to your team.\n\nMy experience includes building scalable applications, collaborating in agile teams, and delivering high-quality code. I admire ${company}'s commitment to excellence and would love to bring my skills to help drive impactful solutions.\n\nI look forward to discussing how I can contribute to ${company}.\n\nBest regards,\n[Your Name]`;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: coverLetter,
          timestamp: new Date().toISOString(),
        },
      ]);

      setIsLoading(false);
      return;
    }

    if (isInterviewQuery) {
      setIsTyping(false);
      const roleMatch = text.match(/(?:for|at)?\s*(frontend|backend|full[- ]?stack|sde|software engineer|data scientist|devops|ml engineer)/i);
      const role = roleMatch ? roleMatch[1] : "Software Engineer";

      const questions = [
        `1. Tell me about your experience with ${role} technologies.`,
        "2. Describe a challenging project you worked on.",
        "3. How do you handle tight deadlines?",
        "4. Walk me through your problem-solving approach.",
        "5. What motivates you in your work?"
      ];

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Common ${role} interview questions:\n\n${questions.join('\n')}\n\nPractice these with specific examples from your experience.`,
          timestamp: new Date().toISOString(),
        },
      ]);

      setIsLoading(false);
      return;
    }

    const result = await askAssistant({ input: text, currentFilters: filters });
    
    setIsTyping(false);
    
    if (result.ok) {
      const conciseMessage = formatAssistantResponse(result.message, text);
      const assistantMsg = {
        role: "assistant",
        content: conciseMessage,
        action: result.action,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      applyFilterAction(result.action);
      setShowQuickReplies(true);
    } else {
      const errorMsg = {
        role: "assistant",
        content: result.message || "Oops! Something went wrong. Can you try asking that differently?",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setShowQuickReplies(true);
    }

    setIsLoading(false);
  };

  const handleQuickReply = (query) => {
    setInput(query);
    handleSend(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setIsLoading(false);
    setShowQuickReplies(true);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`chat-bubble ${isOpen ? 'chat-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with AI Assistant"
      >
        {isOpen ? (
          <span className="chat-icon-close">✕</span>
        ) : (
          <>
            <span className="chat-icon">💬</span>
            <span className="chat-pulse"></span>
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="assistant-avatar">
                <span>🤖</span>
                <span className="status-indicator"></span>
              </div>
              <div>
                <h3>AI Job Assistant</h3>
              </div>
            </div>
            <div className="chat-actions">
              <button
                className="chat-new-btn"
                onClick={handleNewChat}
                aria-label="New chat"
                title="New chat"
              >
                ＋
              </button>
              <button 
                className="chat-close-btn" 
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, idx) => {
              if (msg.role === "system") {
                return (
                  <div key={idx} className="system-message">
                    {msg.content}
                  </div>
                );
              }
              
              return (
                <div 
                  key={idx} 
                  className={`chat-msg msg-${msg.role}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {msg.role === "assistant" && (
                    <div className="msg-avatar">🤖</div>
                  )}
                  <div className="msg-bubble">
                    <p>{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="msg-avatar user-avatar">👤</div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="chat-msg msg-assistant typing-indicator">
                <div className="msg-avatar">🤖</div>
                <div className="msg-bubble">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p className="typing-text">{typingText}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length > 0 && (
            <div className="quick-replies">
              <div className="quick-replies-grid">
                {QUICK_REPLIES.map((reply, idx) => (
                  <button
                    key={idx}
                    className="quick-reply-btn"
                    onClick={() => handleQuickReply(reply.query)}
                    disabled={isLoading}
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything... e.g., 'Show remote React jobs'"
                rows="1"
                disabled={isLoading}
              />
              <button
                className="chat-send-btn"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? "⏳" : "🚀"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Floating Button */
        .chat-bubble {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 999;
        }

        .chat-bubble:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
        }

        .chat-bubble.chat-open {
          transform: scale(0.9);
        }

        .chat-icon {
          position: relative;
          z-index: 2;
        }

        .chat-icon-close {
          font-size: 32px;
          color: white;
          font-weight: 300;
        }

        .chat-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(102, 126, 234, 0.4);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        /* Chat Panel */
        .chat-panel {
          position: fixed;
          bottom: 96px;
          right: 20px;
          width: min(420px, calc(100vw - 32px));
          height: min(600px, calc(100vh - 140px));
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 998;
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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

        /* Header */
        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header-content {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .assistant-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background: #22c55e;
          border: 2px solid white;
          border-radius: 50%;
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chat-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .chat-subtitle {
          margin: 2px 0 0 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .chat-close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .chat-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chat-new-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .chat-new-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .chat-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f9fafb;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-msg {
          display: flex;
          gap: 8px;
          animation: messageSlide 0.3s ease-out forwards;
          opacity: 0;
        }

        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .msg-assistant {
          justify-content: flex-start;
        }

        .msg-user {
          justify-content: flex-end;
        }

        .msg-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .user-avatar {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .msg-bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 16px;
          position: relative;
        }

        .msg-assistant .msg-bubble {
          background: white;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .msg-user .msg-bubble {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .msg-bubble p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        /* System Messages */
        .system-message {
          text-align: center;
          padding: 8px 16px;
          margin: 8px auto;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 211, 238, 0.1));
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 20px;
          color: #047857;
          font-size: 12px;
          font-weight: 600;
          max-width: 80%;
          animation: slideInUp 0.3s ease;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Typing Indicator */
        .typing-indicator {
          opacity: 1 !important;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }

        .typing-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #667eea;
          animation: typingBounce 1.4s infinite;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }

        .typing-text {
          font-size: 12px;
          color: #6b7280;
          margin: 4px 0 0 0;
        }

        /* Quick Replies */
        .quick-replies {
          padding: 12px 20px;
          background: white;
          border-top: 1px solid #e5e7eb;
        }


        .quick-replies-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .quick-reply-btn {
          padding: 6px 12px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .quick-reply-btn:hover:not(:disabled) {
          background: #e5e7eb;
          border-color: #667eea;
          transform: translateY(-1px);
        }

        .quick-reply-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Input */
        .chat-input-container {
          padding: 16px 20px;
          background: white;
          border-top: 1px solid #e5e7eb;
        }

        .chat-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .chat-input {
          flex: 1;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-family: inherit;
          font-size: 14px;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          max-height: 100px;
        }

        .chat-input:focus {
          border-color: #667eea;
        }

        .chat-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .chat-send-btn {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }


        /* Mobile Responsive */
        @media (max-width: 640px) {
          .chat-panel {
            bottom: 0;
            right: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }

          .chat-bubble {
            bottom: 16px;
            right: 16px;
            width: 56px;
            height: 56px;
            font-size: 24px;
          }
        }

        /* Scrollbar */
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
}
