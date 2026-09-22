import { newId, useStoredState } from '../lib/storage'
import type { CalendarEvent } from '../lib/types'

export function useEvents() {
  const [events, setEvents] = useStoredState<CalendarEvent[]>('events', [])

  const addEvent = (
    input: Omit<CalendarEvent, 'id' | 'createdAt'>,
  ): CalendarEvent => {
    const event: CalendarEvent = {
      ...input,
      id: newId(),
      createdAt: new Date().toISOString(),
    }
    setEvents((prev) =>
      [...prev, event].sort((a, b) => a.start.localeCompare(b.start)),
    )
    return event
  }

  const updateEvent = (id: string, patch: Partial<CalendarEvent>) => {
    setEvents((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, ...patch } : e))
        .sort((a, b) => a.start.localeCompare(b.start)),
    )
  }

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return { events, addEvent, updateEvent, removeEvent }
}
