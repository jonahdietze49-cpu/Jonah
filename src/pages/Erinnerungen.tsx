import { CheckCircle2, Circle, ListChecks, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  EmptyState,
  Input,
  SectionTitle,
  Select,
} from '../components/ui'
import { useReminders } from '../hooks/useReminders'
import type { ReminderPriority } from '../lib/types'

const PRIORITY_LABEL: Record<ReminderPriority, string> = {
  low: 'Niedrig',
  normal: 'Normal',
  high: 'Hoch',
}
const PRIORITY_COLOR: Record<ReminderPriority, string> = {
  low: 'text-[var(--text-muted)] bg-[var(--surface-2)]',
  normal: 'text-[var(--accent)] bg-[var(--accent-soft)]',
  high: 'text-[var(--danger)] bg-[var(--danger)]/10',
}

type Filter = 'offen' | 'erledigt' | 'alle'

export default function Erinnerungen() {
  const { reminders, addReminder, toggleDone, removeReminder } =
    useReminders()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState<ReminderPriority>('normal')
  const [filter, setFilter] = useState<Filter>('offen')

  const filtered = useMemo(() => {
    const list = reminders.filter((r) => {
      if (filter === 'offen') return !r.done
      if (filter === 'erledigt') return r.done
      return true
    })
    return list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return (a.due ?? '9999').localeCompare(b.due ?? '9999')
    })
  }, [reminders, filter])

  const handleAdd = () => {
    if (!title.trim()) return
    addReminder({
      title: title.trim(),
      due: due ? new Date(due).toISOString() : undefined,
      priority,
    })
    setTitle('')
    setDue('')
    setPriority('normal')
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Erinnerungen"
        subtitle="Behalte im Blick, was ansteht"
      />

      <Card className="p-4 space-y-3">
        <Input
          placeholder="Was steht an?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as ReminderPriority)}
          >
            <option value="low">Niedrig</option>
            <option value="normal">Normal</option>
            <option value="high">Hoch</option>
          </Select>
        </div>
        <Button variant="primary" onClick={handleAdd} className="w-full">
          <Plus size={16} />
          Erinnerung hinzufügen
        </Button>
      </Card>

      <div className="flex gap-2">
        {(['offen', 'erledigt', 'alle'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
              filter === f
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ListChecks size={20} />} title="Nichts zu tun" />
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.id}>
              <Card className="p-3.5 flex items-center gap-3">
                <button
                  onClick={() => toggleDone(r.id)}
                  aria-label="Erledigt umschalten"
                >
                  {r.done ? (
                    <CheckCircle2 size={20} className="text-[var(--success)]" />
                  ) : (
                    <Circle size={20} className="text-[var(--text-muted)]" />
                  )}
                </button>
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={`text-sm font-medium truncate ${r.done ? 'line-through text-[var(--text-muted)]' : ''}`}
                  >
                    {r.title}
                  </p>
                  {r.due && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(r.due).toLocaleString('de-DE', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium rounded-full px-2 py-1 shrink-0 ${PRIORITY_COLOR[r.priority]}`}
                >
                  {PRIORITY_LABEL[r.priority]}
                </span>
                <button
                  onClick={() => removeReminder(r.id)}
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
