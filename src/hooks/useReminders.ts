import { newId, useStoredState } from '../lib/storage'
import type { Reminder } from '../lib/types'

export function useReminders() {
  const [reminders, setReminders] = useStoredState<Reminder[]>(
    'reminders',
    [],
  )

  const addReminder = (
    input: Omit<Reminder, 'id' | 'createdAt' | 'done'>,
  ): Reminder => {
    const reminder: Reminder = {
      ...input,
      id: newId(),
      done: false,
      createdAt: new Date().toISOString(),
    }
    setReminders((prev) => [...prev, reminder])
    return reminder
  }

  const toggleDone = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r)),
    )
  }

  const updateReminder = (id: string, patch: Partial<Reminder>) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }

  const removeReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  const markNotified = (id: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, notifiedAt: new Date().toISOString() } : r,
      ),
    )
  }

  return {
    reminders,
    addReminder,
    toggleDone,
    updateReminder,
    removeReminder,
    markNotified,
  }
}
