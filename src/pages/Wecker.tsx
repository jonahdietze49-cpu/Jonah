import { AlarmClock, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, EmptyState, Input, SectionTitle } from '../components/ui'
import { useAlarms } from '../hooks/useAlarms'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function formatDays(days: number[]) {
  if (days.length === 0) return 'Einmalig'
  if (days.length === 7) return 'Täglich'
  const weekdays = [0, 1, 2, 3, 4]
  const weekend = [5, 6]
  if (
    days.length === 5 &&
    weekdays.every((d) => days.includes(d))
  )
    return 'Werktags'
  if (days.length === 2 && weekend.every((d) => days.includes(d)))
    return 'Wochenende'
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS[d])
    .join(', ')
}

export default function Wecker() {
  const { alarms, addAlarm, toggleAlarm, removeAlarm } = useAlarms()
  const [showForm, setShowForm] = useState(false)
  const [time, setTime] = useState('07:00')
  const [label, setLabel] = useState('')
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4])

  const toggleDay = (d: number) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    )
  }

  const handleAdd = () => {
    if (!time) return
    addAlarm({ time, label: label.trim(), days })
    setLabel('')
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Wecker"
        subtitle="Alarme mit Wochentagen oder einmalig"
        action={
          <Button variant="secondary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={16} />
            Alarm
          </Button>
        }
      />

      {showForm && (
        <Card className="p-4 space-y-4 text-left">
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
              Uhrzeit
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="max-w-40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
              Bezeichnung
            </label>
            <Input
              placeholder="z.B. Aufstehen"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
              Wiederholen
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {WEEKDAYS.map((w, i) => (
                <button
                  key={w}
                  onClick={() => toggleDay(i)}
                  className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                    days.includes(i)
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Keine Auswahl = klingelt einmalig am nächsten passenden Tag.
            </p>
          </div>
          <Button variant="primary" onClick={handleAdd} className="w-full">
            Alarm speichern
          </Button>
        </Card>
      )}

      {alarms.length === 0 ? (
        <EmptyState
          icon={<AlarmClock size={20} />}
          title="Noch keine Alarme"
          description="Leg einen Wecker an, um pünktlich erinnert zu werden."
        />
      ) : (
        <ul className="space-y-2">
          {alarms.map((alarm) => (
            <li key={alarm.id}>
              <Card className="p-4 flex items-center gap-4">
                <button
                  onClick={() => toggleAlarm(alarm.id)}
                  aria-label={alarm.enabled ? 'Deaktivieren' : 'Aktivieren'}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    alarm.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      alarm.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <div className="flex-1 min-w-0 text-left">
                  <div
                    className={`text-2xl font-semibold tabular-nums ${
                      alarm.enabled ? '' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {alarm.time}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] truncate">
                    {alarm.label ? alarm.label + ' · ' : ''}
                    {alarm.snoozedUntil
                      ? 'Schlummert bis ' +
                        new Date(alarm.snoozedUntil).toLocaleTimeString(
                          'de-DE',
                          { hour: '2-digit', minute: '2-digit' },
                        )
                      : formatDays(alarm.days)}
                  </div>
                </div>
                <button
                  onClick={() => removeAlarm(alarm.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] shrink-0"
                  aria-label="Löschen"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
