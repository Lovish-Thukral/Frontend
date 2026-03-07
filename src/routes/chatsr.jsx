import { useState, useRef, useEffect } from "react";

const STUDENT_PROFILE = {
  name: "Student",
  class: 6,
  marks: { Math: 78, Science: 85, English: 72, Hindi: 80, SST: 68 },
  academicLevel: "Intermediate",
  logicalAbility: "Developing",
  problemSolving: "Average",
  interests: ["Science", "Drawing", "Cricket"],
  weakSubjects: ["SST", "English"],
  strongSubjects: ["Science", "Math"],
};

const SYSTEM_PROMPT = `You are EduGuide AI — a friendly, intelligent academic mentor for a Class 6 student. You speak in simple, encouraging, easy-to-understand language suitable for a 11-12 year old.

Here is the student's profile:
- Name: ${STUDENT_PROFILE.name}
- Class: ${STUDENT_PROFILE.class}
- Marks: Math: ${STUDENT_PROFILE.marks.Math}%, Science: ${STUDENT_PROFILE.marks.Science}%, English: ${STUDENT_PROFILE.marks.English}%, Hindi: ${STUDENT_PROFILE.marks.Hindi}%, SST: ${STUDENT_PROFILE.marks.SST}%
- Academic Level: ${STUDENT_PROFILE.academicLevel}
- Logical Ability: ${STUDENT_PROFILE.logicalAbility}
- Problem Solving: ${STUDENT_PROFILE.problemSolving}
- Interests: ${STUDENT_PROFILE.interests.join(", ")}
- Weak Subjects: ${STUDENT_PROFILE.weakSubjects.join(", ")}
- Strong Subjects: ${STUDENT_PROFILE.strongSubjects.join(", ")}

RULES:
1. Always personalize your answers based on the student's profile above.
2. If the student asks about a weak subject, be extra encouraging and offer simple tips.
3. If they ask about their strong subjects, praise them and help them go deeper.
4. Use examples from their interests (Science, Drawing, Cricket) to explain concepts when relevant.
5. Keep answers concise, friendly, and motivating. Use emojis occasionally to keep it fun.
6. If asked about career or future, guide them based on their interests and strengths.
7. Never be discouraging. Always end with a positive note or encouragement.`;

const SUGGESTED_QUESTIONS = [
  "How can I improve in SST?",
  "Explain photosynthesis simply",
  "Tips for better English writing",
  "What career suits my interests?",
  "Help me with fractions",
  "How to study smarter?",
];

const SubjectBadge = ({ subject, score }) => {
  const color =
    score >= 80
      ? "#4ade80"
      : score >= 70
      ? "#facc15"
      : "#f87171";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "6px",
      background: "rgba(255,255,255,0.06)", borderRadius: "8px",
      padding: "5px 10px", fontSize: "12px", color: "#ddd"
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      {subject}: <strong style={{ color }}>{score}%</strong>
    </div>
  );
};

const TypingIndicator = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px" }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 8, height: 8, borderRadius: "50%", background: "#818cf8",
        animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s`
      }} />
    ))}
  </div>
);

export default function StudentGuideAI() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey there! 👋 I'm **EduGuide**, your personal AI study buddy!\n\nI know you're great at **Science & Math** 🔬 and I'm here to help you shine even brighter in **SST & English** too!\n\nWhat would you like to learn today?`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });
      const data = await response.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Sorry, I couldn't respond. Try again!";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Oops! Something went wrong. Please check your connection." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0f1a; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(129,140,248,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(129,140,248,0); }
        }
        .msg-bubble { animation: fadeUp 0.3s ease forwards; }
        .send-btn:hover { background: linear-gradient(135deg, #6366f1, #8b5cf6) !important; transform: scale(1.05); }
        .send-btn:active { transform: scale(0.97); }
        .suggest-btn:hover { background: rgba(129,140,248,0.2) !important; border-color: #818cf8 !important; color: #c7d2fe !important; }
        .input-box:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d2f45; border-radius: 4px; }
        .profile-panel { animation: fadeUp 0.2s ease forwards; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#0d0f1a",
        fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column",
        alignItems: "center", padding: "20px 16px",
      }}>

        {/* Header */}
        <div style={{
          width: "100%", maxWidth: 720, display: "flex",
          justifyContent: "space-between", alignItems: "center", marginBottom: 20
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, animation: "pulse-glow 2s infinite"
            }}>🎓</div>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: "#e0e7ff", fontSize: 18 }}>
                EduGuide<span style={{ color: "#818cf8" }}>AI</span>
              </div>
              <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, letterSpacing: 1 }}>
                YOUR PERSONAL STUDY MENTOR
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowProfile(!showProfile)}
            style={{
              background: showProfile ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(99,102,241,0.3)", borderRadius: 10,
              padding: "8px 14px", color: "#a5b4fc", cursor: "pointer",
              fontSize: 13, fontFamily: "'Nunito', sans-serif", fontWeight: 700,
              transition: "all 0.2s"
            }}
          >
            {showProfile ? "✕ Close" : "👤 My Profile"}
          </button>
        </div>

        {/* Profile Panel */}
        {showProfile && (
          <div className="profile-panel" style={{
            width: "100%", maxWidth: 720, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(99,102,241,0.25)", borderRadius: 16,
            padding: "20px 24px", marginBottom: 16
          }}>
            <div style={{ color: "#c7d2fe", fontWeight: 800, fontSize: 15, marginBottom: 14 }}>
              📊 Student Profile — Class {STUDENT_PROFILE.class}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {Object.entries(STUDENT_PROFILE.marks).map(([s, m]) => (
                <SubjectBadge key={s} subject={s} score={m} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#94a3b8" }}>
              <span>🧠 Logic: <strong style={{ color: "#a5b4fc" }}>{STUDENT_PROFILE.logicalAbility}</strong></span>
              <span>🔧 Problem Solving: <strong style={{ color: "#a5b4fc" }}>{STUDENT_PROFILE.problemSolving}</strong></span>
              <span>🎯 Interests: <strong style={{ color: "#a5b4fc" }}>{STUDENT_PROFILE.interests.join(", ")}</strong></span>
            </div>
          </div>
        )}

        {/* Chat Window */}
        <div style={{
          width: "100%", maxWidth: 720, flex: 1,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, overflow: "hidden",
          display: "flex", flexDirection: "column", minHeight: 500
        }}>
          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "24px 20px",
            display: "flex", flexDirection: "column", gap: 16
          }}>
            {messages.map((msg, i) => (
              <div key={i} className="msg-bubble" style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, marginRight: 10, marginTop: 2
                  }}>🎓</div>
                )}
                <div style={{
                  maxWidth: "72%",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                    : "rgba(255,255,255,0.07)",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "12px 16px",
                  color: msg.role === "user" ? "#fff" : "#d1d5db",
                  fontSize: 14, lineHeight: 1.65,
                  border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
                  dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
                />
              </div>
            ))}
            {loading && (
              <div className="msg-bubble" style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, marginRight: 10
                }}>🎓</div>
                <div style={{
                  background: "rgba(255,255,255,0.07)", borderRadius: "18px 18px 18px 4px",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}>
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div style={{
              padding: "0 20px 16px", display: "flex", flexWrap: "wrap", gap: 8
            }}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button key={i} className="suggest-btn" onClick={() => sendMessage(q)}
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 20, padding: "6px 14px",
                    color: "#94a3b8", cursor: "pointer", fontSize: 12,
                    fontFamily: "'Nunito', sans-serif", fontWeight: 600,
                    transition: "all 0.2s"
                  }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", gap: 10, alignItems: "center",
            background: "rgba(0,0,0,0.2)"
          }}>
            <input
              className="input-box"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything about your studies... 📚"
              disabled={loading}
              style={{
                flex: 1, background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12, padding: "12px 16px",
                color: "#e2e8f0", fontSize: 14,
                fontFamily: "'Nunito', sans-serif",
                transition: "all 0.2s"
              }}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() && !loading
                  ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                  : "rgba(255,255,255,0.08)",
                border: "none", borderRadius: 12,
                width: 46, height: 46, cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, transition: "all 0.2s", flexShrink: 0
              }}
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ color: "#374151", fontSize: 11, marginTop: 16, textAlign: "center" }}>
          EduGuide AI • Hackathon Demo • Powered by Claude
        </div>
      </div>
    </>
  );
}