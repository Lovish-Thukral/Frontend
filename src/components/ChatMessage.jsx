export default function ChatMessage({ message }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-5 py-3 rounded-2xl max-w-xl text-sm leading-relaxed shadow-lg ${
          isUser
            ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-br-none"
            : "bg-zinc-800/70 backdrop-blur-md border border-zinc-700 text-zinc-100 rounded-bl-none"
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}