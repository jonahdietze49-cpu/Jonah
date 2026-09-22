import * as chrono from 'chrono-node'

export interface ParsedVoiceEvent {
  title: string
  start: Date
  end?: Date
  raw: string
}

const FILLER_PATTERNS = [
  /^termin(e)?\s*/i,
  /^erinnere\s+mich\s*/i,
  /^erinnerung\s*/i,
  /^neuer\s+termin\s*/i,
  /^füge\s+(einen\s+)?termin\s+hinzu\s*/i,
  /^trag(e)?\s*/i,
  /^eintragen\s*/i,
  /^kalender(eintrag)?\s*/i,
  /\s*(bitte)\s*$/i,
  /^(an|für|am)\s+/i,
]

/**
 * Turns a spoken German sentence like
 * "Termin morgen um 15 Uhr Zahnarzt" or
 * "Erinnere mich am Montag um 9 Uhr an das Meeting mit Anna"
 * into a title + date, using chrono-node's German parser for the date/time
 * span and treating the rest of the sentence as the title.
 */
export function parseVoiceEvent(text: string): ParsedVoiceEvent | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const results = chrono.de.parse(trimmed, new Date(), { forwardDate: true })
  if (results.length === 0) return null

  const result = results[0]
  const start = result.start.date()
  const end = result.end?.date()

  let title = (
    trimmed.slice(0, result.index) +
    ' ' +
    trimmed.slice(result.index + result.text.length)
  ).trim()

  for (const pattern of FILLER_PATTERNS) {
    title = title.replace(pattern, '').trim()
  }
  title = title.replace(/^[,.:;\-–\s]+|[,.:;\-–\s]+$/g, '').trim()
  title = title.replace(/\s{2,}/g, ' ')

  if (!title) title = 'Termin'
  title = title.charAt(0).toUpperCase() + title.slice(1)

  return { title, start, end, raw: trimmed }
}

export interface SpeechRecognitionLike {
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
  lang: string
  interimResults: boolean
  continuous: boolean
}

export function createSpeechRecognizer(): SpeechRecognitionLike | null {
  const w = window as any
  const Impl = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Impl) return null
  const recognizer: SpeechRecognitionLike = new Impl()
  recognizer.lang = 'de-DE'
  recognizer.interimResults = false
  recognizer.continuous = false
  return recognizer
}
