interface Topic {
  id: string
  keywords: string[]
  reply: string
}

const TOPICS: Topic[] = [
  {
    id: 'sprachbefehl',
    keywords: [
      'sprach',
      'stimme',
      'sagen',
      'mikro',
      'spreche',
      'diktier',
      'voice',
    ],
    reply:
      'Im Kalender gibt es den Button „Sprachbefehl". Tippen, sprechen, fertig – z. B. „Termin morgen um 15 Uhr Zahnarzt" oder „Erinnere mich am Montag um 9 Uhr an das Meeting mit Anna". Luma erkennt Datum und Uhrzeit automatisch und du kannst den Vorschlag vor dem Speichern noch anpassen. Braucht Mikrofonzugriff und funktioniert am besten in Safari oder Chrome.',
  },
  {
    id: 'mailkonto',
    keywords: [
      'google',
      'gmail',
      'microsoft',
      'outlook',
      'mail konto',
      'mail-konto',
      'e-mail konto',
      'konto verbinden',
      'postfach',
      'icloud',
      'imap',
    ],
    reply:
      'In den Einstellungen unter „Verbundene Konten" kannst du dein Google- oder Microsoft/Outlook-Konto verbinden – Luma zeigt dann ungelesene Mails und anstehende Termine auf der Übersicht an. Dafür brauchst du eine eigene, kostenlose Zugangs-ID (Anleitung direkt dort). iCloud/Apple Mail und klassische IMAP-Postfächer bieten keine passende Schnittstelle für Websites und lassen sich deshalb nicht anbinden.',
  },
  {
    id: 'kalender',
    keywords: ['kalender', 'termin', 'event', 'meeting'],
    reply:
      'Im Kalender-Tab siehst du eine Monatsübersicht. Über „+ Termin" legst du Termine per Hand an (Titel + Datum/Uhrzeit), oder du nutzt den Sprachbefehl-Button für die schnelle Variante per Zuruf. Tage mit Terminen zeigen einen kleinen Punkt.',
  },
  {
    id: 'wecker',
    keywords: [
      'wecker',
      'alarm',
      'klingel',
      'aufwachen',
      'schlummer',
      'weck mich',
    ],
    reply:
      'Im Wecker-Tab kannst du über „+ Alarm" eine Uhrzeit, eine Bezeichnung und optional Wochentage festlegen. Ohne ausgewählte Tage klingelt der Alarm einmalig und schaltet sich danach selbst aus. Beim Klingeln kannst du „Schlummern" (9 Minuten) wählen oder direkt beenden. Wichtig: Luma muss dafür geöffnet sein (Tab oder installierte App) – bei komplett geschlossener App klingelt nichts.',
  },
  {
    id: 'lernen',
    keywords: [
      'lernen',
      'karteikarte',
      'karteikarten',
      'deck',
      'vokabel',
      'wiederhol',
      'flashcard',
    ],
    reply:
      'Im Lernen-Tab legst du erst ein Deck an (z. B. „Vokabeln Englisch"), dann über das Ebenen-Symbol einzelne Karteikarten mit Vorder- und Rückseite. Beim Lernen zeigt Luma dir die fälligen Karten, du bewertest nach dem Umdrehen mit „Nochmal", „Schwer", „Gut" oder „Einfach" – danach werden die Karten automatisch neu terminiert, ähnlich wie bei Anki.',
  },
  {
    id: 'erinnerungen',
    keywords: [
      'erinnerung',
      'erinnerungen',
      'aufgabe',
      'todo',
      'to-do',
      'fällig',
      'aufgaben',
    ],
    reply:
      'Im Erinnerungen-Tab fügst du Aufgaben mit optionalem Fälligkeitsdatum und Priorität hinzu. Über die Filter „Offen / Erledigt / Alle" behältst du den Überblick, und mit einem Klick auf den Kreis hakst du eine Aufgabe ab.',
  },
  {
    id: 'installieren',
    keywords: [
      'installier',
      'homescreen',
      'home-bildschirm',
      'startbildschirm',
      'app hinzufügen',
      'dock',
      'herunterladen',
      'download',
    ],
    reply:
      'Luma ist eine installierbare Web-App. Auf iPhone/iPad: Safari öffnen → Teilen-Symbol → „Zum Home-Bildschirm". Auf dem MacBook: Safari oder Chrome öffnen → Menü → „Zum Dock hinzufügen" bzw. App installieren. Danach startet Luma wie eine normale App, mit eigenem Icon und Vollbild. Details stehen auch in den Einstellungen.',
  },
  {
    id: 'benachrichtigungen',
    keywords: [
      'benachrichtig',
      'notification',
      'push',
      'melden',
      'hinweis bekommen',
    ],
    reply:
      'Unter Einstellungen → Benachrichtigungen kannst du sie mit einem Klick aktivieren (der Browser fragt einmalig nach Erlaubnis). Danach erinnert Luma dich an fällige Aufgaben und anstehende Termine – solange die App als Tab oder installierte App geöffnet ist. Die Vorlaufzeit lässt sich dort ebenfalls einstellen.',
  },
  {
    id: 'daten',
    keywords: [
      'backup',
      'export',
      'import',
      'daten',
      'sichern',
      'übertrag',
      'löschen',
      'zurücksetzen',
    ],
    reply:
      'All deine Daten bleiben lokal auf diesem Gerät (localStorage) – es gibt kein Konto und keinen Server. In den Einstellungen kannst du unter „Daten" ein Backup als JSON-Datei exportieren und auf einem anderen Gerät wieder importieren. Dort findest du auch „Alle Daten löschen", falls du komplett neu starten willst.',
  },
  {
    id: 'ueberblick',
    keywords: [
      'was kannst du',
      'funktionen',
      'features',
      'hilfe',
      'übersicht',
      'was ist luma',
      'was macht',
    ],
    reply:
      'Luma hat fünf Bereiche: Übersicht (Tagesüberblick), Kalender (Termine, auch per Sprache), Wecker (Alarme mit Wochentagen), Lernen (Karteikarten mit Wiederholung) und Erinnerungen (Aufgaben mit Priorität). Frag mich einfach gezielt zu einem davon, z. B. „Wie lege ich einen Wecker an?".',
  },
  {
    id: 'gruss',
    keywords: ['hallo', 'hi', 'hey', 'moin', 'servus', 'na'],
    reply:
      'Hey! Ich bin dein Luma-Assistent und helfe dir bei allem rund um die App – Kalender, Sprachbefehle, Wecker, Lernen, Erinnerungen, Installation oder deine Daten. Wonach suchst du?',
  },
  {
    id: 'danke',
    keywords: ['danke', 'super', 'cool', 'top', 'perfekt'],
    reply: 'Gerne! Wenn noch etwas unklar ist, frag einfach weiter.',
  },
]

const FALLBACK =
  'Dazu habe ich leider noch keine passende Antwort. Frag mich gern konkreter zu Kalender, Sprachbefehl, Wecker, Lernen, Erinnerungen, Installation oder deinen Daten.'

export function getAssistantReply(input: string): string {
  const text = input.toLowerCase()
  let best: Topic | null = null
  let bestScore = 0

  for (const topic of TOPICS) {
    const score = topic.keywords.reduce(
      (sum, kw) => (text.includes(kw) ? sum + 1 : sum),
      0,
    )
    if (score > bestScore) {
      bestScore = score
      best = topic
    }
  }

  return best ? best.reply : FALLBACK
}

export const ASSISTANT_SUGGESTIONS = [
  'Wie lege ich einen Termin per Sprache an?',
  'Wie stelle ich einen Wecker?',
  'Wie funktioniert das Lernen mit Karteikarten?',
  'Wie installiere ich Luma auf dem Homescreen?',
]

export const ASSISTANT_GREETING =
  'Hey, ich bin dein Luma-Assistent! Frag mich alles rund um die App – zum Beispiel zu Sprachbefehlen, dem Wecker oder wie du Luma installierst.'
