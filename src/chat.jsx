import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";

export default function Chat({ setIsAuthenticated }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatBuffer, setChatBuffer] = useState([]);
    const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("nextep_user"));
    console.log("Stored User:", storedUser);
    setUser(storedUser);
  }, []);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("nextep_auth");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const newMessage = { role: "user", content: text };
    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    setLoading(true);

    // 🔥 DEBUG BUFFER LOGIC
    const updatedBuffer = [...chatBuffer, newMessage];

    console.log("🟢 USER MESSAGE ADDED");
    console.log("Buffer BEFORE update:", chatBuffer);
    console.log("Buffer AFTER update:", updatedBuffer);
    console.log("📊 Current buffer length:", updatedBuffer.length);

    setChatBuffer(updatedBuffer);

    try {
      // 🔹 MAIN CHAT API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/main/Chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            UserData: {
              RIASEC: {
                Realistic: 30,
                Investigative: 90,
                Artistic: 20,
                Social: 15,
                Enterprising: 35,
                Conventional: 55,
              },
              SIFA: {
                Sensing: 40,
                Intuitive: 55,
                Feeling: 15,
                Analytical: 92,
              },
            },
            messages: updatedMessages,
          }),
        }
      );

      const data = await response.json();

      const reply =
        data.reply ||
        data.response ||
        data.message ||
        data.output ||
        "No reply from server";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);

      // 🔥 CHECK IF BUFFER REACHED 10
      if (updatedBuffer.length >= 10) {
        console.log("🚀 BUFFER REACHED 10 MESSAGES");
        console.table(updatedBuffer);

        fetch(
          `${import.meta.env.VITE_API_BASE_URL}/main/updateScoringVals`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: updatedBuffer,
            }),
          }
        )
          .then(() => {
            console.log("✅ Scoring API call completed successfully");
          })
          .catch((err) => {
            console.error("❌ Scoring API Error:", err);
          });

        console.log("🔄 RESETTING BUFFER TO EMPTY");

        setChatBuffer([]);
      }
    } catch (error) {
      console.error("❌ Chat API Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Server error" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-zinc-800">

  {/* Left side title */}
  <h1 className="text-xl font-bold text-blue-400">
    Nextep AI
  </h1>

  {/* Push buttons to right */}
  <div className="ml-auto flex gap-3">

    <button
      onClick={() => navigate("/levels")}
      className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition"
    >
      Levels
    </button>

    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 transition"
    >
      Logout
    </button>

  </div>
</div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {loading && (
          <ChatMessage
            message={{ role: "assistant", content: "Typing..." }}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}