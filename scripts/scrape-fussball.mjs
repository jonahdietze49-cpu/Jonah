// Experimenteller Scraper für den öffentlichen Spielplan von TuS Hornau
// (1. Herren, Verbandsliga Mitte) auf fussball.de.
//
// Läuft als geplanter GitHub-Actions-Job (nicht clientseitig, da fussball.de
// keine CORS-Freigabe für Browser-Fetches hat). Schreibt erkannte Spiele
// nach public/data/fussball-spielplan.json, die App liest die Datei und
// bietet neue Spiele zur Übernahme in den Kalender an.
//
// UNGETESTET gegen die echte Seite (das Entwicklungsnetzwerk, in dem dieses
// Skript geschrieben wurde, kann fussball.de nicht erreichen) – daher sehr
// ausführliches Logging, damit sich die Erkennung anhand echter Action-Logs
// nachschärfen lässt.

import { mkdir, writeFile } from 'node:fs/promises'
import * as chrono from 'chrono-node'
import * as cheerio from 'cheerio'

const TEAM_URL =
  'https://www.fussball.de/mannschaft/tus-hornau-tus-hornau-hessen/-/saison/2627/team-id/011MIE16DC000000VTVG0001VTR8C1K7'
const OUTPUT_PATH = 'public/data/fussball-spielplan.json'
const OWN_TEAM_HINTS = ['tus hornau', 'hornau']

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; LumaAppBot/1.0; +https://github.com/jonahdietze49-cpu/Jonah)',
      'Accept-Language': 'de-DE,de;q=0.9',
    },
  })
  console.log(`GET ${url} -> ${res.status} ${res.statusText}`)
  if (!res.ok) return null
  return res.text()
}

/** Verbindet die direkten Text-Kindknoten eines Elements mit Leerzeichen,
 * damit z.B. Tabellenzellen ("27.09.2026", "14:30", "TuS Hornau") nicht
 * ohne Trennzeichen zusammenlaufen. */
function rowText($, el) {
  const parts = []
  $(el)
    .find('*')
    .addBack()
    .contents()
    .each((_, node) => {
      if (node.type === 'text') {
        const t = node.data.trim()
        if (t) parts.push(t)
      }
    })
  return parts.join(' ')
}

function toMatch(date, rest) {
  const clean = rest
    .replace(/^[-:.,–]+|[-:.,–]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (clean.length < 3) return null

  const vsMatch = clean.match(/^(.+?)\s*(?:-|–|vs\.?|:)\s*(.+)$/i)
  if (!vsMatch) return null
  const [, left, right] = vsMatch
  const leftIsUs = OWN_TEAM_HINTS.some((h) => left.toLowerCase().includes(h))
  const rightIsUs = OWN_TEAM_HINTS.some((h) => right.toLowerCase().includes(h))

  let home = null
  let opponent = null
  if (leftIsUs && !rightIsUs) {
    home = true
    opponent = right.trim()
  } else if (rightIsUs && !leftIsUs) {
    home = false
    opponent = left.trim()
  } else {
    return null
  }

  return {
    id: `${date.toISOString().slice(0, 16)}-${opponent.toLowerCase().replace(/\s+/g, '-')}`,
    date: date.toISOString(),
    opponent,
    home,
    competition: 'Verbandsliga Mitte',
  }
}

// "So." / "Mo." etc. am Zeilenanfang wird von chrono sonst fälschlich als
// eigenständiges (falsches) Datum erkannt statt als reine Wochentagsangabe.
const LEADING_WEEKDAY = /^(mo|di|mi|do|fr|sa|so)\.?\s*/i

function extractFromLines(lines, label) {
  const found = []
  for (const line of lines) {
    const cleanedLine = line.replace(LEADING_WEEKDAY, '')
    const parsed = chrono.de.parse(cleanedLine, new Date(), {
      forwardDate: true,
    })
    if (parsed.length === 0) continue
    // chrono kann mehrere Kandidaten je Zeile finden – der längste Treffer
    // ist erfahrungsgemäß der vollständige Datum+Uhrzeit-Span.
    const r = parsed.reduce((best, cur) =>
      cur.text.length > best.text.length ? cur : best,
    )
    const date = r.start.date()
    const rest =
      cleanedLine.slice(0, r.index) + ' ' + cleanedLine.slice(r.index + r.text.length)
    const match = toMatch(date, rest)
    if (match) found.push(match)
  }
  console.log(`[${label}] ${lines.length} Zeilen geprüft, ${found.length} Spiel(e) erkannt.`)
  return found
}

function dedupe(matches) {
  const seen = new Set()
  return matches.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}

/** Diagnose: Links zu Spiel-Detailseiten sind ein sehr zuverlässiges Signal
 * für echte Spielplan-Zeilen (im Gegensatz zu Navigation/Widgets). */
function logMatchLinkDiagnostics($) {
  const matchLinks = $('a[href*="/spiel/"], a[href*="spiel-id"]')
  console.log(`\n[Diagnose] ${matchLinks.length} Link(s) mit "/spiel/" bzw. "spiel-id" im href gefunden.`)
  matchLinks.slice(0, 5).each((_, el) => {
    console.log('  href:', $(el).attr('href'))
  })

  const classCounts = new Map()
  $('[class]').each((_, el) => {
    const cls = $(el).attr('class') || ''
    for (const token of cls.split(/\s+/)) {
      if (/spiel|match|termin|fixture/i.test(token)) {
        classCounts.set(token, (classCounts.get(token) || 0) + 1)
      }
    }
  })
  const sorted = [...classCounts.entries()].sort((a, b) => b[1] - a[1])
  console.log(`[Diagnose] Auffällige class-Namen (spiel/match/termin/fixture):`)
  for (const [cls, count] of sorted.slice(0, 20)) {
    console.log(`  ${cls}: ${count}x`)
  }
}

function extractMatches(html) {
  const $ = cheerio.load(html)
  logMatchLinkDiagnostics($)

  // Strategie A (bevorzugt): Zeilen, die einen Link zu einer Spiel-
  // Detailseite enthalten – deutlich präziseres Signal als generische
  // Tabellen-/Listen-Selektoren, die auch Navigation & Widgets treffen.
  const linkRows = new Set()
  $('a[href*="/spiel/"], a[href*="spiel-id"]').each((_, a) => {
    const row = $(a).closest('tr, li').get(0) ?? $(a).parent().get(0)
    if (row) linkRows.add(row)
  })
  const linkRowLines = [...linkRows].map((el) => rowText($, el)).filter(Boolean)
  const fromLinkRows = extractFromLines(linkRowLines, 'Spiel-Link-Zeilen')
  if (fromLinkRows.length > 0) return dedupe(fromLinkRows)

  // Strategie B (Fallback, unpräziser): generische Zeilen-Elemente.
  const rowSelectors = ['tr', 'li', '[class*="match" i]', '[class*="spiel" i]']
  const rowEls = new Set()
  for (const sel of rowSelectors) {
    $(sel).each((_, el) => rowEls.add(el))
  }
  const leafRowEls = [...rowEls].filter(
    (el) => !rowSelectors.some((sel) => $(el).find(sel).length > 0),
  )
  const rowLines = leafRowEls.map((el) => rowText($, el)).filter(Boolean)
  const fromRows = extractFromLines(rowLines, 'Zeilen-Elemente (Fallback)')

  return dedupe(fromRows)
}

async function main() {
  const html = await fetchHtml(TEAM_URL)
  if (!html) {
    console.warn('Seite nicht erreichbar – Datei bleibt unverändert.')
    return
  }

  console.log(`HTML-Länge: ${html.length} Zeichen`)
  console.log('--- Diagnose: erste 1500 Zeichen des HTML ---')
  console.log(html.slice(0, 1500))
  console.log('--- Ende Diagnose-Ausschnitt ---')

  const looksLikeSpa =
    html.length < 20000 && /<app-root|id="root"|ng-version/i.test(html)
  if (looksLikeSpa) {
    console.warn(
      'Hinweis: Seite sieht nach einer JS-gerenderten App aus (wenig HTML, ' +
        'app-root/ng-version gefunden). Der Spielplan wird dann vermutlich ' +
        'per XHR nachgeladen und steht hier noch nicht im HTML – das müsste ' +
        'dann über einen anderen Endpunkt gelöst werden.',
    )
  }

  const matches = extractMatches(html)
  console.log(`\nInsgesamt erkannt: ${matches.length} Spiel(e)`)
  for (const m of matches) {
    console.log(` - ${m.date} ${m.home ? 'Heim' : 'Auswärts'} vs. ${m.opponent}`)
  }

  if (matches.length === 0) {
    console.warn(
      'Keine Spiele erkannt – bestehende Datei (falls vorhanden) bleibt unverändert.',
    )
    return
  }

  await mkdir('public/data', { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(matches, null, 2) + '\n', 'utf-8')
  console.log(`Geschrieben nach ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error('Scraper-Fehler:', err)
  process.exitCode = 1
})
