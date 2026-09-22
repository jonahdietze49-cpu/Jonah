import { AlertCircle, Check, Mic, MicOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useVoiceCommand } from '../hooks/useVoiceCommand'
import { Button, Card, Input } from './ui'

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function VoiceQuickAdd({
  onCreate,
}: {
  onCreate: (title: string, start: Date) => void
}) {
  const { status, transcript, parsed, error, supported, start, reset } =
    useVoiceCommand()
  const [open, setOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editStart, setEditStart] = useState('')

  useEffect(() => {
    if (parsed) {
      setEditTitle(parsed.title)
      setEditStart(toLocalInputValue(parsed.start))
    }
  }, [parsed])

  const handleOpen = () => {
    setOpen(true)
    reset()
    start()
  }

  const handleClose = () => {
    setOpen(false)
    reset()
  }

  const handleConfirm = () => {
    if (!editTitle.trim() || !editStart) return
    onCreate(editTitle.trim(), new Date(editStart))
    handleClose()
  }

  if (!open) {
    return (
      <Button variant="primary" onClick={handleOpen} className="shrink-0">
        <Mic size={16} />
        Sprachbefehl
      </Button>
    )
  }

  return (
    <Card className="p-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {status === 'listening' ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--danger)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--danger)]" />
              </span>
              Ich höre zu…
            </>
          ) : status === 'processing' ? (
            'Verarbeite…'
          ) : (
            'Sprachbefehl'
          )}
        </div>
        <button
          onClick={handleClose}
          className="text-[var(--text-muted)] hover:text-[var(--text)]"
          aria-label="Schließen"
        >
          <X size={18} />
        </button>
      </div>

      {!supported && (
        <div className="flex gap-2 text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-xl p-3 mb-3">
          <AlertCircle size={18} className="shrink-0" />
          Spracherkennung wird von diesem Browser nicht unterstützt. Nutze
          Safari (iPhone/iPad/Mac) oder Chrome.
        </div>
      )}

      {transcript && (
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Gehört: „{transcript}"
        </p>
      )}

      {error && (
        <div className="flex gap-2 text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-xl p-3 mb-3">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {parsed && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
              Titel
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
              Datum & Uhrzeit
            </label>
            <Input
              type="datetime-local"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="primary" onClick={handleConfirm}>
              <Check size={16} />
              Termin speichern
            </Button>
            <Button variant="ghost" onClick={handleOpen}>
              <MicOff size={16} />
              Erneut sprechen
            </Button>
          </div>
        </div>
      )}

      {!parsed && status !== 'listening' && status !== 'error' && supported && (
        <Button variant="secondary" onClick={handleOpen}>
          <Mic size={16} />
          Nochmal versuchen
        </Button>
      )}

      <p className="text-xs text-[var(--text-muted)] mt-3">
        Beispiel: „Termin morgen um 15 Uhr Zahnarzt" oder „Erinnere mich am
        Montag um 9 Uhr an das Meeting mit Anna".
      </p>
    </Card>
  )
}
