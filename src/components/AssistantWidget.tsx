import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  ASSISTANT_GREETING,
  ASSISTANT_SUGGESTIONS,
  getAssistantReply,
} from '../lib/assistant'

interface Message {
  role: 'assistant' | 'user'
  text: string
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', text: ASSISTANT_GREETING }])
    }
  }, [open, messages.length])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, typing])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: getAssistantReply(trimmed) },
      ])
      setTyping(false)
    }, 450)
  }

  return (
    <div className="fixed z-40 left-4 md:left-[288px] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 flex flex-col items-start gap-3">
      {open && (
        <div className="w-[min(92vw,360px)] h-[min(70vh,480px)] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MessageCircle size={15} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight">
                  Luma Assistent
                </div>
                <div className="text-[11px] opacity-80 leading-tight">
                  Hilfe zur Bedienung
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-white/15 shrink-0"
              aria-label="Schließen"
            >
              <X size={18} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[var(--accent)] text-white rounded-br-sm'
                      : 'bg-[var(--surface-2)] text-[var(--text)] rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-muted)]">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                  </span>
                </div>
              </div>
            )}
            {messages.length <= 1 && !typing && (
              <div className="flex flex-col gap-1.5 pt-1">
                {ASSISTANT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-xs rounded-xl border border-[var(--border)] px-3 py-2 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2 p-3 border-t border-[var(--border)] shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Frag den Assistenten…"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="h-10 w-10 shrink-0 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center disabled:opacity-40"
              aria-label="Senden"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="h-14 w-14 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shadow-xl flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label={open ? 'Assistent schließen' : 'Assistent öffnen'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
