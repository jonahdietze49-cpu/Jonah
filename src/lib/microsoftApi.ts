import type { MailCalendarEvent, MailMessage } from './types'

async function apiErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json()
    return data.error?.message || `${res.status} ${res.statusText}`
  } catch {
    return `${res.status} ${res.statusText}`
  }
}

export async function fetchUnreadOutlookMail(
  accessToken: string,
  maxResults = 6,
): Promise<MailMessage[]> {
  const url =
    'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages' +
    `?$filter=${encodeURIComponent('isRead eq false')}` +
    `&$top=${maxResults}&$select=subject,from,bodyPreview&$orderby=${encodeURIComponent('receivedDateTime desc')}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(await apiErrorMessage(res))
  const data = await res.json()
  return (data.value ?? []).map((m: any) => ({
    id: m.id,
    subject: m.subject || '(kein Betreff)',
    from: m.from?.emailAddress?.name || m.from?.emailAddress?.address || '',
    snippet: m.bodyPreview ?? '',
    provider: 'microsoft' as const,
  }))
}

export async function fetchUpcomingOutlookEvents(
  accessToken: string,
  maxResults = 6,
): Promise<MailCalendarEvent[]> {
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const url =
    'https://graph.microsoft.com/v1.0/me/calendarView' +
    `?startDateTime=${encodeURIComponent(now.toISOString())}` +
    `&endDateTime=${encodeURIComponent(in30Days.toISOString())}` +
    `&$top=${maxResults}&$orderby=${encodeURIComponent('start/dateTime')}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
  })
  if (!res.ok) throw new Error(await apiErrorMessage(res))
  const data = await res.json()
  return (data.value ?? []).map((item: any) => ({
    id: item.id,
    summary: item.subject ?? '(Ohne Titel)',
    start: item.isAllDay ? item.start?.dateTime?.slice(0, 10) : item.start?.dateTime + 'Z',
    allDay: !!item.isAllDay,
    htmlLink: item.webLink,
    provider: 'microsoft' as const,
  }))
}
