import { AlarmClock, BellOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAlarms } from '../hooks/useAlarms'
import { onAlarmRing } from '../lib/alarmBus'
import { playAlarmSound, stopAlarmSound } from '../lib/alarmSound'
import type { Alarm } from '../lib/types'
import { Button } from './ui'

export function RingingOverlay() {
  const { snoozeAlarm } = useAlarms()
  const [ringing, setRinging] = useState<Alarm | null>(null)

  useEffect(() => {
    return onAlarmRing((alarm) => {
      setRinging(alarm)
      playAlarmSound()
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('⏰ ' + (alarm.label || 'Wecker'), {
          body: alarm.time,
          tag: 'alarm-' + alarm.id,
          icon: '/icons/icon-192.png',
        })
      }
    })
  }, [])

  if (!ringing) return null

  const handleDismiss = () => {
    stopAlarmSound()
    setRinging(null)
  }

  const handleSnooze = () => {
    stopAlarmSound()
    snoozeAlarm(ringing.id, 9)
    setRinging(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-[var(--accent)] text-white px-6 safe-top safe-bottom">
      <div className="h-24 w-24 rounded-full bg-white/15 flex items-center justify-center animate-pulse">
        <AlarmClock size={48} />
      </div>
      <div className="text-center">
        <div className="text-5xl font-semibold tabular-nums">{ringing.time}</div>
        <div className="text-lg mt-2 opacity-90">{ringing.label || 'Wecker'}</div>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={handleSnooze}
          className="!bg-white/15 !text-white hover:!bg-white/25 w-full py-3"
        >
          Schlummern (9 Min)
        </Button>
        <Button
          onClick={handleDismiss}
          className="!bg-white !text-[var(--accent)] hover:opacity-90 w-full py-3"
        >
          <BellOff size={16} />
          Beenden
        </Button>
      </div>
    </div>
  )
}
