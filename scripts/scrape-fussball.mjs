// Experimenteller Scraper für den öffentlichen Spielplan von TuS Hornau
// (1. Herren, Verbandsliga Mitte) auf fussball.de.
//
// Läuft als geplanter GitHub-Actions-Job (nicht clientseitig, da fussball.de
// keine CORS-Freigabe für Browser-Fetches hat). Schreibt erkannte Spiele
// nach public/data/fussball-spielplan.json, die App liest die Datei und
// bietet neue Spiele zur Übernahme in den Kalender an.
//
// Erkenntnis aus echten Testläufen: Links zu Spiel-Detailseiten haben die
// Form https://www.fussball.de/spiel/<heim-slug>-<auswaerts-slug>/-/spiel/<id>
// – daraus lassen sich Gegner und Heim/Auswärts viel zuverlässiger ableiten
// als aus umgebendem Fließtext (der auch Navigations-/Widget-Rauschen wie
// "Zum Spiel"-Linktexte oder falsche Jahre aus anderen Seitenbereichen
// enthält). Das Kickoff-Datum kommt weiterhin aus dem Text der jeweiligen
// Tabellenzeile, per chrono-node erkannt.

import { mkdir, writeFile } from 'node:fs/promises'
import * as chrono from 'chrono-node'
import * as cheerio from 'cheerio'

const TEAM_URL =
  'https://www.fussball.de/mannschaft/tus-hornau-tus-hornau-hessen/-/saison/2627/team-id/011MIE16DC000000VTVG0001VTR8C1K7'
const OUTPUT_PATH = 'public/data/fussball-spielplan.json'
const OWN_SLUG = 'tus-hornau'
// Container-Klassen, die (laut Diagnose-Lauf) die eigentliche Saison-
// Spielplantabelle enthalten – nicht die kleine "Letztes/Nächstes Spiel"-
// Widget-Box (class="match-wrapper"), die nur 2 Einträge hat und keine
// verlässliche Datumsangabe in der Zeile selbst liefert.
const TABLE_CONTAINER_SELECTOR = '.club-matchplan-table, .fixtures-matches-table'
const LEADING_WEEKDAY = /^(mo|di|mi|do|fr|sa|so)\.?\s*/i

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
 * damit z.B. Tabellenzellen nicht ohne Trennzeichen zusammenlaufen. */
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

/** Titelt einen URL-Slug wie "sg-oberliederbach" in "SG Oberliederbach".
 * Heuristik: sehr kurze Tokens (≤3 Zeichen, z.B. TSG/SG/FC/SV/DJK) werden
 * großgeschrieben, alles andere nur am Wortanfang. Nicht perfekt (z.B.
 * Umlaute fehlen im Slug, "TuRa" würde zu "Tura"), aber für eine Vorschau
 * mit Bestätigung vor der Übernahme ausreichend. */
function titleFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

/** Leitet Gegner + Heim/Auswärts direkt aus der Spiel-URL ab, z.B.
 * "/spiel/tus-hornau-tsg-wieseck/-/spiel/0318..." -> Heimspiel vs. TSG Wieseck. */
function matchInfoFromHref(href) {
  const slugMatch = href.match(/\/spiel\/([a-z0-9-]+)\/-\/spiel\/([a-zA-Z0-9]+)/)
  if (!slugMatch) return null
  const [, teamsSlug, matchId] = slugMatch

  let home, opponentSlug
  if (teamsSlug.startsWith(OWN_SLUG + '-')) {
    home = true
    opponentSlug = teamsSlug.slice(OWN_SLUG.length + 1)
  } else if (teamsSlug.endsWith('-' + OWN_SLUG)) {
    home = false
    opponentSlug = teamsSlug.slice(0, -(OWN_SLUG.length + 1))
  } else {
    return null
  }

  return { matchId, home, opponent: titleFromSlug(opponentSlug) }
}

function logDiagnostics($) {
  const matchLinks = $('a[href*="/spiel/"]')
  console.log(`\n[Diagnose] ${matchLinks.length} Link(s) mit "/spiel/" im href gefunden.`)
  const containers = $(TABLE_CONTAINER_SELECTOR)
  console.log(`[Diagnose] ${containers.length} Container mit "${TABLE_CONTAINER_SELECTOR}" gefunden.`)

  // Zeigt, wie viele Links INNERHALB vs. AUSSERHALB der bekannten Container
  // liegen – hilft zu verstehen, ob der volle Saison-Spielplan überhaupt auf
  // dieser Seite steht oder ob nur ein "letzte/nächste Spiele"-Widget erfasst wird.
  const containerEls = containers.toArray()
  let inside = 0
  let outside = 0
  const outsideParentClasses = new Map()
  matchLinks.each((_, a) => {
    const isInside = containerEls.some((c) => $.contains(c, a) || c === a)
    if (isInside) {
      inside += 1
    } else {
      outside += 1
      let el = a.parent
      for (let depth = 0; depth < 4 && el; depth += 1, el = el.parent) {
        const cls = $(el).attr && $(el).attr('class')
        if (cls) {
          outsideParentClasses.set(cls, (outsideParentClasses.get(cls) || 0) + 1)
        }
      }
    }
  })
  console.log(`[Diagnose] Spiel-Links innerhalb bekannter Container: ${inside}, außerhalb: ${outside}`)
  if (outside > 0) {
    const sorted = [...outsideParentClasses.entries()].sort((a, b) => b[1] - a[1])
    console.log('[Diagnose] Häufigste class-Namen im Umfeld der "außerhalb"-Links:')
    for (const [cls, count] of sorted.slice(0, 15)) {
      console.log(`  ${cls}: ${count}x`)
    }
  }
}

function extractMatches(html) {
  const $ = cheerio.load(html)
  logDiagnostics($)

  // Ganze Seite durchsuchen statt nur die bekannten Widget-Container – der
  // volle Saison-Spielplan kann in weiteren, noch unbekannten Abschnitten
  // der Seite stehen. Die URL-Slug-Ableitung (matchInfoFromHref) bleibt das
  // präzise Signal, das Rauschen fernhält, nicht der Container.
  const seenIds = new Set()
  const found = []

  $('a[href*="/spiel/"]').each((_, a) => {
    const href = $(a).attr('href') || ''
    const info = matchInfoFromHref(href)
    if (!info || seenIds.has(info.matchId)) return

    const row = $(a).closest('tr, li').get(0) ?? $(a).parent().get(0)
    const rowLine = row ? rowText($, row) : ''
    const cleanedLine = rowLine.replace(LEADING_WEEKDAY, '')
    const parsed = chrono.de.parse(cleanedLine, new Date(), { forwardDate: true })
    if (parsed.length === 0) return
    const r = parsed.reduce((best, cur) => (cur.text.length > best.text.length ? cur : best))
    const date = r.start.date()

    seenIds.add(info.matchId)
    found.push({
      id: `${date.toISOString().slice(0, 16)}-${info.opponent.toLowerCase().replace(/\s+/g, '-')}`,
      date: date.toISOString(),
      opponent: info.opponent,
      home: info.home,
      competition: 'Verbandsliga Mitte',
    })
  })

  console.log(`[Spiel-Links gesamte Seite] ${found.length} Spiel(e) erkannt.`)
  return found
}

async function main() {
  const html = await fetchHtml(TEAM_URL)
  if (!html) {
    console.warn('Seite nicht erreichbar – Datei bleibt unverändert.')
    return
  }

  console.log(`HTML-Länge: ${html.length} Zeichen`)

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
