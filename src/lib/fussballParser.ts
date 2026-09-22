import * as chrono from 'chrono-node'
import type { FussballMatch } from './types'

/** Textfragmente, die auf die eigene Mannschaft hindeuten (für Heim/Auswärts-Erkennung) */
const OWN_TEAM_HINTS = ['tus hornau', 'hornau']

export interface ParsedMatchLine {
  raw: string
  date: Date | null
  opponent: string
  home: boolean | null
}

// "So." / "Mo." etc. am Zeilenanfang wird von chrono sonst fälschlich als
// eigenständiges (falsches) Datum erkannt statt als reine Wochentagsangabe.
const LEADING_WEEKDAY = /^(mo|di|mi|do|fr|sa|so)\.?\s*/i

function stripLeftovers(text: string): string {
  return text
    .replace(LEADING_WEEKDAY, '')
    .replace(/^[-:.,–]+|[-:.,–]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Parst mehrzeiligen, aus fussball.de kopierten Spielplan-Text. Jede Zeile
 * wird per chrono-node auf ein erkennbares Datum/Uhrzeit geprüft; der Rest
 * der Zeile wird als Gegner (bzw. "Heim - Auswärts") interpretiert.
 */
export function parseFussballSchedule(text: string): ParsedMatchLine[] {
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
      return { raw: line, date: null, opponent: line, home: null }
    }
    // chrono kann mehrere Kandidaten je Zeile finden – der längste Treffer
    // ist erfahrungsgemäß der vollständige Datum+Uhrzeit-Span.
    const r = results.reduce((best, cur) =>
      cur.text.length > best.text.length ? cur : best,
    )
    const date = r.start.date()
    const rest = stripLeftovers(
      cleanedLine.slice(0, r.index) +
        ' ' +
        cleanedLine.slice(r.index + r.text.length),
    )

    let opponent = rest
    let home: boolean | null = null
    const vsMatch = rest.match(/^(.+?)\s*(?:-|–|vs\.?|:)\s*(.+)$/i)
    if (vsMatch) {
      const [, left, right] = vsMatch
      const leftIsUs = OWN_TEAM_HINTS.some((h) =>
        left.toLowerCase().includes(h),
      )
      const rightIsUs = OWN_TEAM_HINTS.some((h) =>
        right.toLowerCase().includes(h),
      )
      if (leftIsUs && !rightIsUs) {
        home = true
        opponent = right.trim()
      } else if (rightIsUs && !leftIsUs) {
        home = false
        opponent = left.trim()
      }
    }

    return { raw: line, date, opponent: opponent || rest || line, home }
  })
}

export function toFussballMatch(p: ParsedMatchLine): FussballMatch | null {
  if (!p.date) return null
  return {
    id: `${p.date.toISOString().slice(0, 16)}-${p.opponent.toLowerCase().replace(/\s+/g, '-')}`,
    date: p.date.toISOString(),
    opponent: p.opponent,
    home: p.home ?? true,
    competition: 'Verbandsliga Mitte',
  }
}

export function matchToEventTitle(m: FussballMatch): string {
  const prefix = m.home ? 'Heimspiel' : 'Auswärtsspiel'
  return `⚽ ${prefix} vs. ${m.opponent}`
}
