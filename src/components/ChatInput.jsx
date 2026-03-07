import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Sparkles, Send } from "lucide-react"

export default function ChatInput({
  onSend,
  placeholder = "What's on your mind?",
  disabled = false,
}) {
  const [text, setText] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef(null)

  const handleSend = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px"
    }
  }, [text])

  const hasText = text.trim().length > 0

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6">
        
        {/* Outer Gradient Border */}
        <div
          className={`
            relative overflow-hidden rounded-3xl p-0.5
            bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500
            transition-all duration-300
            ${isFocused ? "scale-[1.02] shadow-2xl shadow-blue-500/20" : ""}
          `}
        >
          {/* Inner Container */}
          <div className="relative flex items-end gap-3 rounded-3xl bg-zinc-900 p-3 sm:p-4">
            
            {/* Sparkle icon */}
            <div
              className={`
                absolute -top-2 -left-2 transition-all duration-300
                ${isFocused ? "opacity-100 rotate-12" : "opacity-0"}
              `}
            >
              <Sparkles className="h-5 w-5 text-yellow-400" />
            </div>

            {/* Textarea */}
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className="
                  w-full resize-none bg-transparent
                  text-sm sm:text-base
                  leading-relaxed text-white
                  placeholder:text-zinc-400
                  focus:outline-none disabled:opacity-50
                "
                style={{ maxHeight: "120px" }}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!hasText || disabled}
              className={`
                h-10 w-10 sm:h-12 sm:w-12
                rounded-2xl border-0
                transition-all duration-300
                ${
                  hasText
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:scale-105 active:scale-95"
                    : "bg-zinc-700 text-zinc-400"
                }
              `}
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
          <kbd className="rounded-md bg-zinc-800 px-2 py-1 text-[11px]">
            Enter
          </kbd>
          <span>to send</span>
          <span className="text-blue-400">•</span>
          <kbd className="rounded-md bg-zinc-800 px-2 py-1 text-[11px]">
            Shift + Enter
          </kbd>
          <span>new line</span>
        </div>
      </div>
    </div>
  )
}