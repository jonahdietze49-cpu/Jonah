import type { MailCalendarEvent, MailMessage } from './types'

async function apiErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json()
    return data.error?.message || `${res.status} ${res.statusText}`
  } catch {
    return `${res.status} ${res.statusText}`
  }
}

export async function fetchUnreadGmail(
  accessToken: string,
  maxResults = 6,
): Promise<MailMessage[]> {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent('is:unread in:inbox')}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!listRes.ok) throw new Error(await apiErrorMessage(listRes))
  const listData = await listRes.json()
  const ids: string[] = (listData.messages ?? []).map((m: any) => m.id)

  const messages = await Promise.all(
    ids.map(async (id): Promise<MailMessage | null> => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (!res.ok) return null
      const data = await res.json()
      const headers: { name: string; value: string }[] =
        data.payload?.headers ?? []
      const get = (name: string) =>
        headers.find((h) => h.name === name)?.value ?? ''
      return {
        id,
        subject: get('Subject') || '(kein Betreff)',
        from: get('From').replace(/<.*>/, '').trim() || get('From'),
        snippet: data.snippet ?? '',
        provider: 'google',
      }
    }),
  )
  return messages.filter((m): m is MailMessage => m !== null)
}

export async function fetchUpcomingCalendarEvents(
  accessToken: string,
  maxResults = 6,
): Promise<MailCalendarEvent[]> {
  const timeMin = new Date().toISOString()
  const url =
    'https://www.googleapis.com/calendar/v3/calendars/primary/events' +
    `?maxResults=${maxResults}&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(await apiErrorMessage(res))
  const data = await res.json()
  return (data.items ?? []).map((item: any) => ({
    id: item.id,
    summary: item.summary ?? '(Ohne Titel)',
    start: item.start?.dateTime ?? item.start?.date,
    allDay: !item.start?.dateTime,
    htmlLink: item.htmlLink,
    provider: 'google',
  }))
}
