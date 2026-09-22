import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ListChecks,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GoogleCard } from '../components/GoogleCard'
import { VoiceQuickAdd } from '../components/VoiceQuickAdd'
import { Button, Card, EmptyState, Input, SectionTitle } from '../components/ui'
import { useDecks } from '../hooks/useDecks'
import { useEvents } from '../hooks/useEvents'
import { useReminders } from '../hooks/useReminders'
import { useSettings } from '../hooks/useSettings'

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default function Dashboard() {
  const { events, addEvent } = useEvents()
  const { reminders, addReminder, toggleDone } = useReminders()
  const { decks } = useDecks()
  const { settings } = useSettings()
  const [quickReminder, setQuickReminder] = useState('')

  const today = new Date()

  const todaysEvents = useMemo(
    () => events.filter((e) => isSameDay(new Date(e.start), new Date())),
    [events],
  )

  const openReminders = useMemo(
    () =>
      reminders
        .filter((r) => !r.done)
        .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999')),
    [reminders],
  )

  const dueRemindersCount = openReminders.filter(
    (r) => r.due && new Date(r.due) <= today,
  ).length

  const cardsDueToday = useMemo(
    () =>
      decks.reduce(
        (sum, d) =>
          sum + d.cards.filter((c) => new Date(c.dueDate) <= new Date()).length,
        0,
      ),
    [decks],
  )

  const handleQuickReminder = () => {
    if (!quickReminder.trim()) return
    addReminder({ title: quickReminder.trim(), priority: 'normal' })
    setQuickReminder('')
  }

  const dateLabel = today.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6">
      <SectionTitle
        title={`${greeting()}${settings.userName ? ', ' + settings.userName : ''}`}
        subtitle={dateLabel}
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<CalendarDays size={18} />}
          label="Heute"
          value={todaysEvents.length}
        />
        <StatCard
          icon={<ListChecks size={18} />}
          label="Fällig"
          value={dueRemindersCount}
        />
        <StatCard
          icon={<Sparkles size={18} />}
          label="Zum Lernen"
          value={cardsDueToday}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 items-start">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base m-0">Heutige Termine</h2>
            <Link
              to="/kalender"
              className="text-xs font-medium text-[var(--accent)]"
            >
              Kalender öffnen
            </Link>
          </div>
          {todaysEvents.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={20} />}
              title="Keine Termine heute"
              description="Genieß den freien Tag oder leg per Sprachbefehl etwas an."
            />
          ) : (
            <ul className="space-y-2">
              {todaysEvents.map((e) => (
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
                  <span className="text-sm truncate">{e.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <VoiceQuickAdd
          onCreate={(title, start) =>
            addEvent({ title, start: start.toISOString(), createdVia: 'voice' })
          }
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base m-0">Erinnerungen</h2>
          <Link
            to="/erinnerungen"
            className="text-xs font-medium text-[var(--accent)]"
          >
            Alle anzeigen
          </Link>
        </div>
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Schnell hinzufügen…"
            value={quickReminder}
            onChange={(e) => setQuickReminder(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickReminder()}
          />
          <Button variant="primary" onClick={handleQuickReminder}>
            Hinzufügen
          </Button>
        </div>
        {openReminders.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={20} />}
            title="Alles erledigt"
            description="Keine offenen Erinnerungen."
          />
        ) : (
          <ul className="space-y-1.5">
            {openReminders.slice(0, 5).map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => toggleDone(r.id)}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[var(--surface-2)]"
                >
                  {r.done ? (
                    <CheckCircle2 size={18} className="text-[var(--success)]" />
                  ) : (
                    <Circle size={18} className="text-[var(--text-muted)]" />
                  )}
                  <span className="text-sm flex-1">{r.title}</span>
                  {r.due && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(r.due).toLocaleDateString('de-DE')}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <GoogleCard />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <Card className="p-3.5 text-left">
      <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
        {icon}
      </div>
      <div className="text-2xl font-semibold leading-none">{value}</div>
      <div className="text-xs text-[var(--text-muted)] mt-1">{label}</div>
    </Card>
  )
}
