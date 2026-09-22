import { AlertCircle, Camera, Check, ChevronDown, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useEvents } from '../hooks/useEvents'
import { toLocalInputValue } from '../lib/dateFormat'
import { parseEventsFromText, type ParsedTextEvent } from '../lib/textEventParser'
import { Button, Card, Input } from './ui'

interface DraftEvent {
  key: string
  title: string
  start: string // datetime-local Wert
  include: boolean
}

function toDrafts(parsed: ParsedTextEvent[]): DraftEvent[] {
  return parsed
    .filter((p): p is ParsedTextEvent & { date: Date } => p.date !== null)
    .map((p, i) => ({
      key: `${i}-${p.date.getTime()}`,
      title: p.title,
      start: toLocalInputValue(p.date),
      include: true,
    }))
}

export function DocumentScanCard() {
  const { addEvent } = useEvents()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<DraftEvent[] | null>(null)
  const [skippedLines, setSkippedLines] = useState(0)
  const [addedCount, setAddedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setStatus('loading')
    setProgress(0)
    setError(null)
    setDrafts(null)
    try {
      const { createWorker } = await import('tesseract.js')
      const base = import.meta.env.BASE_URL
      const worker = await createWorker('deu', 1, {
        workerPath: `${base}tesseract/worker.min.js`,
        corePath: `${base}tesseract/tesseract-core-simd-lstm.wasm.js`,
        langPath: `${base}tesseract/lang-data`,
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })
      const {
        data: { text },
      } = await worker.recognize(file)
      await worker.terminate()

      const parsed = parseEventsFromText(text)
      const withDate = toDrafts(parsed)
      setDrafts(withDate)
      setSkippedLines(parsed.length - withDate.length)
      setStatus('idle')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Texterkennung fehlgeschlagen. Versuch es mit einem schärferen Foto.',
      )
      setStatus('error')
    }
  }

  const handlePick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) handleFile(file)
  }

  const updateDraft = (key: string, patch: Partial<DraftEvent>) => {
    setDrafts((prev) =>
      (prev ?? []).map((d) => (d.key === key ? { ...d, ...patch } : d)),
    )
  }

  const removeDraft = (key: string) => {
    setDrafts((prev) => (prev ?? []).filter((d) => d.key !== key))
  }

  const commit = () => {
    const toAdd = (drafts ?? []).filter((d) => d.include && d.title.trim())
    for (const d of toAdd) {
      addEvent({
        title: d.title.trim(),
        start: new Date(d.start).toISOString(),
        createdVia: 'scan',
      })
    }
    setAddedCount((c) => c + toAdd.length)
    setDrafts(null)
  }

  return (
    <Card className="p-4 text-left">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-[var(--accent)]" />
          <h2 className="font-semibold text-base m-0">Zettel scannen</h2>
        </div>
        <ChevronDown
          size={18}
          className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-[var(--text-muted)]">
            Foto von einem Zettel, Aushang oder Elternbrief hochladen – Luma
            liest den Text (direkt im Browser, ohne Server) und schlägt
            erkannte Termine vor.
          </p>

          {addedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-[var(--success)]">
              <Check size={16} /> {addedCount} Termin(e) im Kalender ergänzt.
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="secondary"
            onClick={handlePick}
            disabled={status === 'loading'}
          >
            <Camera size={16} />
            {status === 'loading' ? `Erkenne Text… ${progress}%` : 'Foto auswählen'}
          </Button>

          {error && (
            <div className="flex gap-2 text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-xl p-3">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {drafts && drafts.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">
              Kein Datum im Foto erkannt. Versuch ein schärferes/geraderes
              Foto oder trag den Termin manuell ein.
            </p>
          )}

          {drafts && drafts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Erkannte Termine – Titel &amp; Uhrzeit vor der Übernahme
                prüfen (OCR ist nicht perfekt)
              </p>
              <ul className="space-y-2">
                {drafts.map((d) => (
                  <li key={d.key}>
                    <div className="flex items-start gap-2 rounded-xl bg-[var(--surface-2)] p-3">
                      <input
                        type="checkbox"
                        checked={d.include}
                        onChange={(e) =>
                          updateDraft(d.key, { include: e.target.checked })
                        }
                        className="h-4 w-4 mt-2.5 accent-[var(--accent)] shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Input
                          value={d.title}
                          onChange={(e) =>
                            updateDraft(d.key, { title: e.target.value })
                          }
                          placeholder="Titel"
                        />
                        <Input
                          type="datetime-local"
                          value={d.start}
                          onChange={(e) =>
                            updateDraft(d.key, { start: e.target.value })
                          }
                        />
                      </div>
                      <button
                        onClick={() => removeDraft(d.key)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)] shrink-0 mt-2.5"
                        aria-label="Entfernen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <Button variant="primary" onClick={commit}>
                Ausgewählte übernehmen
              </Button>
              {skippedLines > 0 && (
                <p className="text-xs text-[var(--text-muted)]">
                  {skippedLines} Zeile(n) ohne erkennbares Datum wurden
                  übersprungen.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
