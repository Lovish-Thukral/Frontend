import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ChatMessage from "./components/ChatMessage"
import ChatInput from "./components/ChatInput"

export default function Chat({ setIsAuthenticated }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleLogout = () => {
    localStorage.removeItem("nextep_auth")
    setIsAuthenticated(false)
    navigate("/login")
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return

    const updatedMessages = [
      ...messages,
      { role: "user", content: text }
    ]

    setMessages(updatedMessages)
    setLoading(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/main/Chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages
          }),
        }
      )

      const data = await response.json()

      // Adjust based on backend response
      const reply =
        data.reply ||
        data.response ||
        data.message ||
        data.output ||
        "No reply from server"

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply }
      ])

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Server error" }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-blue-400">
          Nextep AI
        </h1>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 transition"
        >
          Logout
        </button>
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
  )
}