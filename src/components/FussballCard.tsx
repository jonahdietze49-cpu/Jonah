import { Check, ChevronDown, Shirt } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useEvents } from '../hooks/useEvents'
import {
  matchToEventTitle,
  parseFussballSchedule,
  toFussballMatch,
  type ParsedMatchLine,
} from '../lib/fussballParser'
import type { FussballMatch } from '../lib/types'
import { Button, Card, Textarea } from './ui'

interface PreviewItem {
  key: string
  match: FussballMatch
  raw: string
  checked: boolean
}

function isDuplicate(existingTitles: Set<string>, match: FussballMatch) {
  const key = match.date.slice(0, 16) + matchToEventTitle(match)
  return existingTitles.has(key)
}

export function FussballCard() {
  const { events, addEvent } = useEvents()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [manualPreview, setManualPreview] = useState<PreviewItem[] | null>(
    null,
  )
  const [unmatchedLines, setUnmatchedLines] = useState<ParsedMatchLine[]>([])
  const [scrapedPreview, setScrapedPreview] = useState<PreviewItem[]>([])
  const [addedCount, setAddedCount] = useState(0)

  const existingKeys = useMemo(() => {
    const set = new Set<string>()
    for (const e of events) {
      if (e.createdVia === 'fussball') {
        set.add(e.start.slice(0, 16) + e.title)
      }
    }
    return set
  }, [events])

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    fetch(`${base}data/fussball-spielplan.json`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((matches: FussballMatch[]) => {
        const items = matches
          .filter((m) => !isDuplicate(existingKeys, m))
          .map((m) => ({
            key: m.id,
            match: m,
            raw: `${new Date(m.date).toLocaleString('de-DE')} · ${m.opponent}`,
            checked: true,
          }))
        setScrapedPreview(items)
      })
      .catch(() => {
        // Datei existiert noch nicht (z.B. vor dem ersten Scraper-Lauf) – kein Fehler, Feature ist optional
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleParse = () => {
    const parsed = parseFussballSchedule(text)
    const matched = parsed
      .map((p) => ({ p, m: toFussballMatch(p) }))
      .filter((x): x is { p: ParsedMatchLine; m: FussballMatch } => !!x.m)
      .filter((x) => !isDuplicate(existingKeys, x.m))
      .map(({ p, m }) => ({
        key: m.id,
        match: m,
        raw: p.raw,
        checked: true,
      }))
    setManualPreview(matched)
    setUnmatchedLines(parsed.filter((p) => !p.date))
  }

  const commit = (items: PreviewItem[], clear: () => void) => {
    const toAdd = items.filter((i) => i.checked)
    for (const item of toAdd) {
      addEvent({
        title: matchToEventTitle(item.match),
        start: item.match.date,
        createdVia: 'fussball',
        notes: item.match.competition,
      })
    }
    setAddedCount((c) => c + toAdd.length)
    clear()
  }

  return (
    <Card className="p-4 text-left">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Shirt size={18} className="text-[var(--accent)]" />
          <h2 className="font-semibold text-base m-0">
            TuS Hornau – Spielplan
          </h2>
        </div>
        <ChevronDown
          size={18}
          className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {addedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-[var(--success)]">
              <Check size={16} /> {addedCount} Spiel(e) im Kalender ergänzt.
            </div>
          )}

          {scrapedPreview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Automatisch erkannt (Beta)
              </p>
              <MatchList
                items={scrapedPreview}
                onToggle={(key) =>
                  setScrapedPreview((prev) =>
                    prev.map((i) =>
                      i.key === key ? { ...i, checked: !i.checked } : i,
                    ),
                  )
                }
              />
              <Button
                variant="primary"
                onClick={() =>
                  commit(scrapedPreview, () => setScrapedPreview([]))
                }
              >
                Ausgewählte übernehmen
              </Button>
            </div>
          )}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Spielplan von fussball.de einfügen
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Öffne die Team-Seite eurer 1. Herren auf fussball.de, kopiere
              die Spielplan-Zeilen (Datum, Uhrzeit, Gegner) und füge sie hier
              ein – eine Zeile pro Spiel.
            </p>
            <Textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                'So. 27.09.26  14:30  TuS Hornau - TSG Wieseck\nSo. 04.10.26  15:00  SG Bruchköbel - TuS Hornau'
              }
            />
            <Button variant="secondary" onClick={handleParse}>
              Erkennen
            </Button>
          </div>

          {manualPreview && manualPreview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Erkannte Spiele
              </p>
              <MatchList
                items={manualPreview}
                onToggle={(key) =>
                  setManualPreview((prev) =>
                    (prev ?? []).map((i) =>
                      i.key === key ? { ...i, checked: !i.checked } : i,
                    ),
                  )
                }
              />
              <Button
                variant="primary"
                onClick={() =>
                  commit(manualPreview, () => setManualPreview(null))
                }
              >
                Ausgewählte übernehmen
              </Button>
            </div>
          )}
          {manualPreview && manualPreview.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">
              Keine neuen Spiele erkannt.
            </p>
          )}
          {unmatchedLines.length > 0 && (
            <p className="text-xs text-[var(--text-muted)]">
              {unmatchedLines.length} Zeile(n) ohne erkennbares Datum wurden
              übersprungen.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

function MatchList({
  items,
  onToggle,
}: {
  items: PreviewItem[]
  onToggle: (key: string) => void
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.key}>
          <label className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggle(item.key)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            <div className="min-w-0">
              <p className="text-sm truncate">
                {matchToEventTitle(item.match)}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {new Date(item.match.date).toLocaleString('de-DE', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </label>
        </li>
      ))}
    </ul>
  )
}
