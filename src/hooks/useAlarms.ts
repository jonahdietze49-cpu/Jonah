import { newId, useStoredState } from '../lib/storage'
import type { Alarm } from '../lib/types'

export function useAlarms() {
  const [alarms, setAlarms] = useStoredState<Alarm[]>('alarms', [])

  const addAlarm = (
    input: Omit<Alarm, 'id' | 'createdAt' | 'enabled'>,
  ): Alarm => {
    const alarm: Alarm = {
      ...input,
      id: newId(),
      enabled: true,
      createdAt: new Date().toISOString(),
    }
    setAlarms((prev) =>
      [...prev, alarm].sort((a, b) => a.time.localeCompare(b.time)),
    )
    return alarm
  }

  const updateAlarm = (id: string, patch: Partial<Alarm>) => {
    setAlarms((prev) =>
      prev
        .map((a) => (a.id === id ? { ...a, ...patch } : a))
        .sort((a, b) => a.time.localeCompare(b.time)),
    )
  }

  const toggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, enabled: !a.enabled, snoozedUntil: undefined }
          : a,
      ),
    )
  }

  const removeAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id))
  }

  const snoozeAlarm = (id: string, minutes: number) => {
    const until = new Date(Date.now() + minutes * 60_000).toISOString()
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, enabled: true, snoozedUntil: until } : a,
      ),
    )
  }

  const clearSnooze = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, snoozedUntil: undefined } : a)),
    )
  }

  return {
    alarms,
    addAlarm,
    updateAlarm,
    toggleAlarm,
    removeAlarm,
    snoozeAlarm,
    clearSnooze,
  }
}
