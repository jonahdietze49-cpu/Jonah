import type { Alarm } from './types'

type Listener = (alarm: Alarm) => void

const listeners = new Set<Listener>()

export function onAlarmRing(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitAlarmRing(alarm: Alarm) {
  for (const l of listeners) l(alarm)
}
