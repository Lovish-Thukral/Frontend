import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";

export default function Chat({ setIsAuthenticated }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatBuffer, setChatBuffer] = useState([]);
  const [user, setUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeSessionIndex, setActiveSessionIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("nextep_user"));
    setUser(storedUser);
    const storedHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    setChatHistory(storedHistory);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem("nextep_auth");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const startNewChat = () => {
    if (messages.length > 0) {
      const updated = [...chatHistory, messages];
      setChatHistory(updated);
      localStorage.setItem("chatHistory", JSON.stringify(updated));
    }
    setMessages([]);
    setActiveSessionIndex(null);
    setChatBuffer([]);
  };

  const loadSession = (index) => {
    setMessages(chatHistory[index]);
    setActiveSessionIndex(index);
    setChatBuffer([]);
  };

  const getSessionTitle = (session) => {
    const first = session.find((m) => m.role === "user");
    return first ? first.content.slice(0, 36) + (first.content.length > 36 ? "…" : "") : "Chat session";
  };

  // Buffer flush: sends name + riasec + sifa + messages
  const flushBuffer = async (buffer) => {
    const storedUser = JSON.parse(localStorage.getItem("nextep_user"));
    const riasec = JSON.parse(localStorage.getItem("riasec") || "{}");
    const sifa = JSON.parse(localStorage.getItem("sifa") || "{}");

    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/main/updateScoringVals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: storedUser?.name,
          riasec,
          sifa,
          messages: buffer,
        }),
      });
      console.log("✅ Scoring vals updated");
    } catch (err) {
      console.error("❌ Scoring API Error:", err);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const newMessage = { role: "user", content: text };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setLoading(true);

    const updatedBuffer = [...chatBuffer, newMessage];
    setChatBuffer(updatedBuffer);

    try {
      const storedUser = JSON.parse(localStorage.getItem("nextep_user"));
      const riasec = JSON.parse(localStorage.getItem("riasec") || "{}");
      const sifa = JSON.parse(localStorage.getItem("sifa") || "{}");

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/main/Chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserData: { RIASEC: riasec, SIFA: sifa, },
          messages: updatedMessages,
        }),
      });

      const data = await response.json();
      const reply = data.reply || data.response || data.message || data.output || "No reply from server";
      const assistantMsg = { role: "assistant", content: reply };

      setMessages((prev) => [...prev, assistantMsg]);

      const fullBuffer = [...updatedBuffer, assistantMsg];

      if (fullBuffer.length >= 10) {
        await flushBuffer(fullBuffer);
        setChatBuffer([]);
      } else {
        setChatBuffer(fullBuffer);
      }
    } catch (error) {
      console.error("❌ Chat API Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Server error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const username = user?.name || localStorage.getItem("username") || "User";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .chat-root {
          display: flex;
          height: 100vh;
          background: #080810;
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
          overflow: hidden;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          width: ${sidebarOpen ? "260px" : "0px"};
          min-width: ${sidebarOpen ? "260px" : "0px"};
          transition: width 0.3s cubic-bezier(0.16,1,0.3,1), min-width 0.3s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
          background: #0d0d18;
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
        }

        .sidebar-inner {
          width: 260px;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 20px 0;
        }

        .sidebar-logo {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          padding: 0 20px 20px;
          background: linear-gradient(135deg, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 12px;
        }

        .new-chat-btn {
          margin: 0 12px 16px;
          padding: 10px 14px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 10px;
          color: #818cf8;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s, border-color 0.2s;
        }
        .new-chat-btn:hover {
          background: rgba(99,102,241,0.2);
          border-color: rgba(99,102,241,0.45);
        }

        .sidebar-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #334155;
          padding: 0 20px 8px;
        }

        .session-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(99,102,241,0.2) transparent;
        }

        .session-item {
          padding: 10px 12px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 2px;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .session-item:hover { background: rgba(255,255,255,0.04); color: #94a3b8; }
        .session-item.active { background: rgba(99,102,241,0.12); color: #a5b4fc; }
        .session-icon { font-size: 12px; opacity: 0.6; flex-shrink: 0; }

        .sidebar-footer {
          padding: 16px 12px 0;
          border-top: 1px solid rgba(255,255,255,0.05);
          margin-top: auto;
        }
        .user-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
        }
        .user-avatar {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 12px; font-weight: 700;
          color: white; flex-shrink: 0;
        }
        .user-name {
          font-size: 13px; font-weight: 500; color: #94a3b8;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ── MAIN AREA ── */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Background grid */
        .main::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── HEADER ── */
        .header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(8,8,16,0.8);
          backdrop-filter: blur(12px);
        }

        .toggle-btn {
          width: 34px; height: 34px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: #64748b;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .toggle-btn:hover { background: rgba(255,255,255,0.08); color: #94a3b8; }

        .header-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700;
          background: linear-gradient(135deg, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-actions {
          margin-left: auto;
          display: flex;
          gap: 8px;
        }

        .hdr-btn {
          padding: 7px 16px;
          border-radius: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 12px; font-weight: 600;
          cursor: pointer;
          border: none;
          transition: transform 0.1s, box-shadow 0.15s;
        }
        .hdr-btn:hover { transform: translateY(-1px); }
        .hdr-btn-levels {
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc;
        }
        .hdr-btn-levels:hover { background: rgba(99,102,241,0.25); }
        .hdr-btn-logout {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5;
        }
        .hdr-btn-logout:hover { background: rgba(239,68,68,0.2); }

        /* ── MESSAGES ── */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 32px 24px;
          position: relative;
          z-index: 1;
          scrollbar-width: thin;
          scrollbar-color: rgba(99,102,241,0.2) transparent;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Empty state */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          opacity: 0.4;
          text-align: center;
          animation: fadeIn 0.5s ease both;
        }
        .empty-icon {
          font-size: 40px;
          filter: grayscale(1);
        }
        .empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 700;
        }
        .empty-sub { font-size: 13px; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 0.4; transform: translateY(0); }
        }

        /* Typing indicator */
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          width: fit-content;
          margin-top: 4px;
        }
        .typing-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #6366f1;
          animation: typingBounce 1.2s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        /* Buffer indicator pill */
        .buffer-pill {
          position: fixed;
          bottom: 90px;
          right: 24px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 500;
          color: #818cf8;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .buffer-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #818cf8;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
        }
      `}</style>

      <div className="chat-root">

        {/* ── SIDEBAR ── */}
        <div className="sidebar">
          <div className="sidebar-inner">
            <div className="sidebar-logo">✦ Nextep AI</div>

            <button className="new-chat-btn" onClick={startNewChat}>
              <span>＋</span> New Chat
            </button>

            <div className="sidebar-section-label">Recent</div>

            <div className="session-list">
              {chatHistory.length === 0 && (
                <div style={{ padding: "8px 12px", fontSize: 12, color: "#1e293b" }}>
                  No previous chats
                </div>
              )}
              {chatHistory.map((session, i) => (
                <div
                  key={i}
                  className={`session-item ${activeSessionIndex === i ? "active" : ""}`}
                  onClick={() => loadSession(i)}
                >
                  <span className="session-icon">💬</span>
                  {getSessionTitle(session)}
                </div>
              ))}
            </div>

            <div className="sidebar-footer">
              <div className="user-chip">
                <div className="user-avatar">{initials}</div>
                <span className="user-name">{username}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="main">
          {/* Header */}
          <div className="header">
            <button className="toggle-btn" onClick={() => setSidebarOpen((p) => !p)}>
              {sidebarOpen ? "←" : "☰"}
            </button>
            <span className="header-title">
              {activeSessionIndex !== null ? `Session ${activeSessionIndex + 1}` : "New Chat"}
            </span>
            <div className="header-actions">
              <button className="hdr-btn hdr-btn-levels" onClick={() => navigate("/levels")}>
                Roadmap
              </button>
              <button className="hdr-btn hdr-btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="messages-area">
            {messages.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-icon"> <img src="src/assets/logo.png" alt="Empty" className="h-48" /> </div>
                <div className="empty-title text-amber-50">What's on your mind?</div>
                <div className="empty-sub text-amber-50">Ask anything about your career path</div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))
            )}

            {loading && (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Buffer pill */}
          {chatBuffer.length > 0 && (
            <div className="buffer-pill">
              <div className="buffer-dot" />
              {chatBuffer.length}/10 buffered
            </div>
          )}

          {/* Input */}
          <ChatInput onSend={sendMessage} />
        </div>
      </div>
    </>
  );
}