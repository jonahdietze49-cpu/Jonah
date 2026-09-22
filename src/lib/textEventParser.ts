import * as chrono from 'chrono-node'

export interface ParsedTextEvent {
  raw: string
  date: Date | null
  title: string
}

// "So." / "Mo." etc. am Zeilenanfang wird von chrono sonst fälschlich als
// eigenständiges (falsches) Datum erkannt statt als reine Wochentagsangabe.
const LEADING_WEEKDAY = /^(mo|di|mi|do|fr|sa|so)\.?\s*/i

function cleanTitle(text: string): string {
  return text
    .replace(LEADING_WEEKDAY, '')
    .trim()
    .replace(/^[-:.,–|]+\s*|\s*[-:.,–|]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Erkennt Zeilen mit Datum/Uhrzeit in beliebigem Text (z.B. per OCR aus
 * einem fotografierten Zettel gewonnen) und liefert je Zeile Datum +
 * verbleibenden Text als möglichen Termin-Titel. Jede Zeile wird für sich
 * geprüft, damit OCR-Zeilenumbrüche als natürliche Trennung dienen.
 */
export function parseEventsFromText(text: string): ParsedTextEvent[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return lines.map((line) => {
    const cleanedLine = line.replace(LEADING_WEEKDAY, '')
    const results = chrono.de.parse(cleanedLine, new Date(), {
      forwardDate: true,
    })
    if (results.length === 0) {
      return { raw: line, date: null, title: line }
    }
    // chrono kann mehrere Kandidaten je Zeile finden – der längste Treffer
    // ist erfahrungsgemäß der vollständige Datum+Uhrzeit-Span.
    const r = results.reduce((best, cur) =>
      cur.text.length > best.text.length ? cur : best,
    )
    const date = r.start.date()
    const rest = cleanTitle(
      cleanedLine.slice(0, r.index) + ' ' + cleanedLine.slice(r.index + r.text.length),
    )
    return { raw: line, date, title: rest || line }
  })
}
