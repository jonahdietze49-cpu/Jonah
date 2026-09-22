import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { VoiceQuickAdd } from '../components/VoiceQuickAdd'
import { Button, Card, EmptyState, Input, SectionTitle } from '../components/ui'
import { useEvents } from '../hooks/useEvents'
import type { CalendarEvent } from '../lib/types'

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function buildMonthGrid(monthDate: Date) {
  const first = startOfMonth(monthDate)
  const firstWeekday = (first.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function Kalender() {
  const { events, addEvent, removeEvent } = useEvents()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [start, setStart] = useState(toLocalInputValue(new Date()))

  const grid = useMemo(() => buildMonthGrid(month), [month])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const key = new Date(e.start).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return map
  }, [events])

  const selectedEvents = (eventsByDay.get(selectedDay.toDateString()) ?? []).sort(
    (a, b) => a.start.localeCompare(b.start),
  )

  const handleAdd = () => {
    if (!title.trim() || !start) return
    addEvent({ title: title.trim(), start: new Date(start).toISOString(), createdVia: 'manual' })
    setTitle('')
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Kalender"
        subtitle="Termine planen – per Hand oder per Sprache"
        action={
          <Button variant="secondary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={16} />
            Termin
          </Button>
        }
      />

      <div className="grid md:grid-cols-[1fr_320px] gap-4 items-start">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
              }
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]"
              aria-label="Vorheriger Monat"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="font-semibold capitalize">
              {month.toLocaleDateString('de-DE', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <button
              onClick={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
              }
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]"
              aria-label="Nächster Monat"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--text-muted)] mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((day, i) => {
              if (!day) return <div key={i} />
              const dayEvents = eventsByDay.get(day.toDateString()) ?? []
              const isSelected = isSameDay(day, selectedDay)
              const isToday = isSameDay(day, new Date())
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white'
                      : isToday
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {day.getDate()}
                  {dayEvents.length > 0 && (
                    <span
                      className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[var(--accent)]'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        <div className="space-y-4">
          {showForm && (
            <Card className="p-4 space-y-3 text-left">
              <Input
                placeholder="Titel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <Input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
              <Button variant="primary" onClick={handleAdd} className="w-full">
                Speichern
              </Button>
            </Card>
          )}

          <VoiceQuickAdd
            onCreate={(t, s) =>
              addEvent({ title: t, start: s.toISOString(), createdVia: 'voice' })
            }
          />
        </div>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold text-base mb-3">
          {selectedDay.toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h2>
        {selectedEvents.length === 0 ? (
          <EmptyState title="Keine Termine an diesem Tag" />
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-3 py-2.5"
              >
                <span className="text-sm font-semibold text-[var(--accent)] w-14 shrink-0">
                  {new Date(e.start).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-sm flex-1">{e.title}</span>
                <button
                  onClick={() => removeEvent(e.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                  aria-label="Löschen"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
