import { useEffect, useRef } from 'react'
import { emitAlarmRing } from '../lib/alarmBus'
import { useAlarms } from './useAlarms'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** 0 = Montag … 6 = Sonntag, passend zur Kalender-Wochenansicht */
function weekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7
}

/**
 * Checks every few seconds whether an enabled alarm's time (or snooze) has
 * arrived and emits a ring event. Runs once at the app root, independent of
 * which page is currently shown.
 */
export function useAlarmScheduler() {
  const { alarms, updateAlarm } = useAlarms()
  const firedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`
      const today = weekdayIndex(now)

      for (const alarm of alarms) {
        if (!alarm.enabled) continue

        if (alarm.snoozedUntil) {
          if (new Date(alarm.snoozedUntil) <= now) {
            updateAlarm(alarm.id, {
              snoozedUntil: undefined,
              enabled: alarm.days.length > 0,
            })
            emitAlarmRing(alarm)
          }
          continue
        }

        if (alarm.time !== hhmm) continue
        if (alarm.days.length > 0 && !alarm.days.includes(today)) continue

        const occurrenceKey = `${alarm.id}:${now.toDateString()}`
        if (firedRef.current.has(occurrenceKey)) continue
        firedRef.current.add(occurrenceKey)

        emitAlarmRing(alarm)
        if (alarm.days.length === 0) {
          updateAlarm(alarm.id, { enabled: false })
        }
      }
    }

    check()
    const interval = setInterval(check, 10_000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarms])
}
