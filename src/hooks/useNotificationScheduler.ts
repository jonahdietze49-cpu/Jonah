import { useEffect } from 'react'
import { useEvents } from './useEvents'
import { useReminders } from './useReminders'
import { useSettings } from './useSettings'

/**
 * Polls due reminders and upcoming events while the app is open and fires
 * browser notifications. Web Notifications only work while Klarblick is
 * running (a tab, or – on iOS 16.4+ / macOS – as an installed home-screen
 * app); there is no server, so nothing fires while it's fully closed.
 */
export function useNotificationScheduler() {
  const { reminders, markNotified } = useReminders()
  const { events } = useEvents()
  const { settings } = useSettings()

  useEffect(() => {
    if (!settings.notificationsEnabled) return
    if (typeof Notification === 'undefined') return

    const check = () => {
      if (Notification.permission !== 'granted') return
      const now = Date.now()
      const leadMs = settings.reminderLeadMinutes * 60_000

      for (const r of reminders) {
        if (r.done || r.notifiedAt || !r.due) continue
        const dueTime = new Date(r.due).getTime()
        if (dueTime - leadMs <= now && now <= dueTime + 5 * 60_000) {
          new Notification('Erinnerung: ' + r.title, {
            body: new Date(r.due).toLocaleString('de-DE'),
            tag: 'reminder-' + r.id,
            icon: '/icons/icon-192.png',
          })
          markNotified(r.id)
        }
      }

      for (const e of events) {
        const startTime = new Date(e.start).getTime()
        const tag = 'event-' + e.id
        if (startTime - leadMs <= now && now <= startTime) {
          const notifiedKey = 'klarblick:notified:' + tag
          if (sessionStorage.getItem(notifiedKey)) continue
          new Notification('Termin: ' + e.title, {
            body: new Date(e.start).toLocaleString('de-DE'),
            tag,
            icon: '/icons/icon-192.png',
          })
          sessionStorage.setItem(notifiedKey, '1')
        }
      }
    }

    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [
    reminders,
    events,
    settings.notificationsEnabled,
    settings.reminderLeadMinutes,
    markNotified,
  ])
}
