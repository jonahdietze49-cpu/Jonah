import { AlertCircle, CalendarClock, Mail, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useGoogleAuth } from '../contexts/GoogleAuthContext'
import {
  fetchUnreadGmail,
  fetchUpcomingCalendarEvents,
  type GCalEvent,
  type GmailMessage,
} from '../lib/googleApi'
import { Button, Card } from './ui'

export function GoogleCard() {
  const { connected, connecting, error, accessToken, connect, disconnect } =
    useGoogleAuth()
  const [mails, setMails] = useState<GmailMessage[]>([])
  const [events, setEvents] = useState<GCalEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = async () => {
    if (!accessToken) return
    setLoading(true)
    setLoadError(null)
    try {
      const [m, e] = await Promise.all([
        fetchUnreadGmail(accessToken, 5),
        fetchUpcomingCalendarEvents(accessToken, 5),
      ])
      setMails(m)
      setEvents(e)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (connected) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected])

  if (!connected) {
    return (
      <Card className="p-4 text-left">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={18} className="text-[var(--accent)]" />
          <h2 className="font-semibold text-base m-0">Google-Konto</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Verbinde dein Google-Konto, um ungelesene Mails und anstehende
          Kalendertermine direkt hier zu sehen.
        </p>
        {error && (
          <div className="flex gap-2 text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-xl p-3 mb-3">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}
        <Button variant="primary" onClick={connect} disabled={connecting}>
          {connecting ? 'Verbinde…' : 'Mit Google verbinden'}
        </Button>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Setup (einmalig) in den Einstellungen unter „Google-Konto".
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-[var(--accent)]" />
          <h2 className="font-semibold text-base m-0">Google-Konto</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] disabled:opacity-50"
            aria-label="Aktualisieren"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={disconnect}
            className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--danger)] px-2"
          >
            Trennen
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex gap-2 text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-xl p-3 mb-3">
          <AlertCircle size={18} className="shrink-0" />
          {loadError}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
            <Mail size={13} /> Ungelesen
          </div>
          {mails.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Keine ungelesenen Mails.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {mails.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl bg-[var(--surface-2)] px-3 py-2"
                >
                  <p className="text-sm font-medium truncate">{m.subject}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {m.from}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-xs font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
            <CalendarClock size={13} /> Anstehend
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Keine anstehenden Termine.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)] px-3 py-2"
                >
                  <span className="text-xs font-semibold text-[var(--accent)] shrink-0">
                    {e.allDay
                      ? new Date(e.start).toLocaleDateString('de-DE')
                      : new Date(e.start).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                  </span>
                  <span className="text-sm truncate">{e.summary}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}
