import { AlertCircle, CalendarClock, Mail, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useGoogleAuth } from '../contexts/GoogleAuthContext'
import { useMicrosoftAuth } from '../contexts/MicrosoftAuthContext'
import { fetchUnreadGmail, fetchUpcomingCalendarEvents } from '../lib/googleApi'
import {
  fetchUnreadOutlookMail,
  fetchUpcomingOutlookEvents,
} from '../lib/microsoftApi'
import type { MailCalendarEvent, MailMessage } from '../lib/types'
import { Button, Card } from './ui'

const PROVIDER_LABEL = { google: 'Gmail', microsoft: 'Outlook' } as const

export function MailAccountsCard() {
  const google = useGoogleAuth()
  const microsoft = useMicrosoftAuth()
  const [mails, setMails] = useState<MailMessage[]>([])
  const [events, setEvents] = useState<MailCalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const anyConnected = google.connected || microsoft.connected

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const mailJobs: Promise<MailMessage[]>[] = []
      const eventJobs: Promise<MailCalendarEvent[]>[] = []
      if (google.connected && google.accessToken) {
        mailJobs.push(fetchUnreadGmail(google.accessToken, 5))
        eventJobs.push(fetchUpcomingCalendarEvents(google.accessToken, 5))
      }
      if (microsoft.connected && microsoft.accessToken) {
        mailJobs.push(fetchUnreadOutlookMail(microsoft.accessToken, 5))
        eventJobs.push(fetchUpcomingOutlookEvents(microsoft.accessToken, 5))
      }
      const [mailResults, eventResults] = await Promise.all([
        Promise.all(mailJobs),
        Promise.all(eventJobs),
      ])
      setMails(mailResults.flat())
      setEvents(
        eventResults.flat().sort((a, b) => a.start.localeCompare(b.start)),
      )
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (anyConnected) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google.connected, microsoft.connected])

  if (!anyConnected) {
    return (
      <Card className="p-4 text-left">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={18} className="text-[var(--accent)]" />
          <h2 className="font-semibold text-base m-0">Mail &amp; Kalender</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Verbinde dein Google- oder Microsoft-Konto, um ungelesene Mails und
          anstehende Kalendertermine direkt hier zu sehen.
        </p>
        <Link to="/einstellungen">
          <Button variant="primary">Konto verbinden</Button>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="p-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-[var(--accent)]" />
          <h2 className="font-semibold text-base m-0">Mail &amp; Kalender</h2>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          aria-label="Aktualisieren"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
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
                  key={`${m.provider}-${m.id}`}
                  className="rounded-xl bg-[var(--surface-2)] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{m.subject}</p>
                    <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] shrink-0">
                      {PROVIDER_LABEL[m.provider]}
                    </span>
                  </div>
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
                  key={`${e.provider}-${e.id}`}
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
                  <span className="text-sm truncate flex-1">{e.summary}</span>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] shrink-0">
                    {PROVIDER_LABEL[e.provider]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}
