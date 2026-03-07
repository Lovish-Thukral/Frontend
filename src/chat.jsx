import { useState, useRef, useEffect } from "react"
import ChatMessage from "@/components/ChatMessage"
import ChatInput from "@/components/ChatInput"

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (text) => {
    const userMessage = { role: "user", content: text }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    // Fake delay for now
    setTimeout(() => {
      const aiMessage = {
        role: "assistant",
        content: "This is an AI response 🚀"
      }
      setMessages((prev) => [...prev, aiMessage])
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {loading && <ChatMessage message={{ role: "assistant", content: "Typing..." }} />}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} />
    </div>
  )
}