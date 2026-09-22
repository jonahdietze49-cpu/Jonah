// Experimenteller Scraper für den öffentlichen Spielplan von TuS Hornau
// (1. Herren, Verbandsliga Mitte) auf fussball.de.
//
// Läuft als geplanter GitHub-Actions-Job (nicht clientseitig, da fussball.de
// keine CORS-Freigabe für Browser-Fetches hat). Schreibt erkannte Spiele
// nach public/data/fussball-spielplan.json, die App liest die Datei und
// bietet neue Spiele zur Übernahme in den Kalender an.
//
// Wichtige Erkenntnis aus echten Testläufen: Die Team-Profilseite
// (/mannschaft/...) zeigt NUR ein "letzte/nächste Spiele"-Fenster
// (~10-12 Einträge über mehrere Saisons/Wettbewerbe gemischt), nicht den
// vollen Saison-Spielplan. Die komplette Liga-Spielplanseite
// (/spielplan/.../-/staffel/...) listet dagegen ALLE Spiele ALLER
// Mannschaften der Staffel – daraus filtern wir per URL-Slug nur die
// Spiele mit TuS Hornau heraus. Spiel-Detail-Links haben die Form
// https://www.fussball.de/spiel/<heim-slug>-<auswaerts-slug>/-/spiel/<id>
// – daraus lassen sich Gegner und Heim/Auswärts zuverlässig ableiten, statt
// sie aus umgebendem Fließtext zu raten. Das Kickoff-Datum kommt aus dem
// Text der jeweiligen Tabellenzeile, per chrono-node erkannt.

import { mkdir, writeFile } from 'node:fs/promises'
import * as chrono from 'chrono-node'
import * as cheerio from 'cheerio'

const LEAGUE_SPIELPLAN_URL =
  'https://www.fussball.de/spielplan/vl-grmitte-hessen-verbandsliga-herren-saison2627-hessen/-/staffel/0318I3K77C00000BVS5489BUVV628VP4-G'
const OUTPUT_PATH = 'public/data/fussball-spielplan.json'
const OWN_SLUG = 'tus-hornau'
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
  const uniqueHrefs = new Set()
  matchLinks.each((_, a) => uniqueHrefs.add($(a).attr('href')))
  console.log(
    `\n[Diagnose] ${matchLinks.length} Link(s) mit "/spiel/" im href gefunden (${uniqueHrefs.size} eindeutige Ziel-URLs).`,
  )
  const ownMatches = [...uniqueHrefs].filter((href) => matchInfoFromHref(href))
  console.log(
    `[Diagnose] Davon ${ownMatches.length} mit "${OWN_SLUG}" auf einer Seite (eigene Spiele).`,
  )
}

/** Sucht in einer Zeile nach einer reinen Uhrzeit (z.B. "18:30"). */
function findTimeInText(text) {
  const m = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  return m ? { hour: Number(m[1]), minute: Number(m[2]) } : null
}

/** Läuft rückwärts durch vorherige Geschwister-Elemente (und danach deren
 * Elternebene) und sucht das nächstgelegene per chrono erkennbare Datum.
 * Deckt das gängige Muster ab, bei dem eine "Spieltag"-Kopfzeile das Datum
 * trägt und die einzelnen Spielzeilen darunter nur noch die Uhrzeit zeigen. */
function findNearestDate($, startEl) {
  let node = startEl
  let hops = 0
  while (node && hops < 80) {
    const prev = node.prev
    if (prev) {
      const text = $(prev).text().trim()
      if (text) {
        const parsed = chrono.de.parse(
          text.replace(LEADING_WEEKDAY, ''),
          new Date(),
          { forwardDate: true },
        )
        if (parsed.length > 0) {
          const r = parsed.reduce((best, cur) =>
            cur.text.length > best.text.length ? cur : best,
          )
          return r.start.date()
        }
      }
      node = prev
    } else {
      node = node.parent
    }
    hops += 1
  }
  return null
}

function extractMatches(html) {
  const $ = cheerio.load(html)
  logDiagnostics($)

  // Diese Seite listet ALLE Spiele ALLER Mannschaften der Staffel – die
  // URL-Slug-Ableitung (matchInfoFromHref) filtert automatisch nur die
  // Spiele heraus, an denen die eigene Mannschaft beteiligt ist.
  const seenIds = new Set()
  const found = []
  let undated = 0
  let diagnosticsLogged = 0

  $('a[href*="/spiel/"]').each((_, a) => {
    const href = $(a).attr('href') || ''
    const info = matchInfoFromHref(href)
    if (!info || seenIds.has(info.matchId)) return

    const row = $(a).closest('tr, li').get(0) ?? $(a).parent().get(0)
    const rowLine = row ? rowText($, row) : ''
    const cleanedLine = rowLine.replace(LEADING_WEEKDAY, '')

    let date = null
    const parsed = chrono.de.parse(cleanedLine, new Date(), {
      forwardDate: true,
    })
    if (parsed.length > 0) {
      const r = parsed.reduce((best, cur) =>
        cur.text.length > best.text.length ? cur : best,
      )
      date = r.start.date()
    } else if (row) {
      // Zeile hat kein eigenes Datum – oft steht nur die Uhrzeit dort und
      // das Datum in einer vorherigen "Spieltag"-Kopfzeile.
      const time = findTimeInText(rowLine)
      const nearestDate = findNearestDate($, row)
      if (nearestDate) {
        date = nearestDate
        if (time) date.setHours(time.hour, time.minute, 0, 0)
      }
    }

    // Nur plausible Saison-Termine akzeptieren (Verbandsliga läuft grob
    // Aug-Juni) – schützt vor Fehltreffern der Rückwärtssuche, die auf
    // unzusammenhängenden Text stoßen könnte.
    const now = new Date()
    const minDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const maxDate = new Date(now.getTime() + 400 * 24 * 60 * 60 * 1000)
    if (date && (date < minDate || date > maxDate)) {
      date = null
    }

    if (!date) {
      undated += 1
      if (diagnosticsLogged < 2 && row) {
        console.log(
          `[Diagnose] Kein Datum für ${info.opponent} – Zeilentext: "${rowLine.slice(0, 200)}"`,
        )
        console.log(`[Diagnose] Zeilen-HTML: ${$.html(row).slice(0, 800)}`)
        const ancestorHtml = $(row).parent().parent().length
          ? $.html($(row).parent().parent())
          : ''
        console.log(
          `[Diagnose] Umgebendes HTML (2 Ebenen höher, gekürzt): ${ancestorHtml.slice(0, 1500)}`,
        )
        diagnosticsLogged += 1
      }
      return
    }

    seenIds.add(info.matchId)
    found.push({
      id: `${date.toISOString().slice(0, 16)}-${info.opponent.toLowerCase().replace(/\s+/g, '-')}`,
      date: date.toISOString(),
      opponent: info.opponent,
      home: info.home,
      competition: 'Verbandsliga Mitte',
    })
  })

  if (undated > 0) {
    console.log(`[Diagnose] ${undated} Spiel(e) ohne erkennbares Datum übersprungen.`)
  }
  console.log(`[Spiel-Links, eigene Mannschaft] ${found.length} Spiel(e) erkannt.`)
  return found
}

async function main() {
  const html = await fetchHtml(LEAGUE_SPIELPLAN_URL)
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
