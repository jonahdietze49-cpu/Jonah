# Luma

Dein Licht im Alltag – als installierbare Web-App (PWA), die auf iPad,
iPhone und MacBook über den Browser läuft und vom Homescreen aus gestartet
werden kann.

## Funktionen

- **Übersicht (Dashboard)** – heutige Termine, offene Erinnerungen und
  Lernfortschritt auf einen Blick.
- **Kalender** – Monatsansicht, Termine manuell oder **per Sprachbefehl**
  anlegen (z. B. „Termin morgen um 15 Uhr Zahnarzt").
- **Wecker** – Alarme mit Uhrzeit, Bezeichnung und Wochentagen (oder einmalig),
  klingelt mit Ton + Benachrichtigung, inkl. Schlummern.
- **Lernen** – Karteikarten-Decks mit einfacher Wiederholung nach
  Lernfortschritt (SM-2-artiges Scheduling).
- **Erinnerungen** – Aufgabenliste mit Fälligkeit, Priorität und
  Browser-Benachrichtigungen.
- **Zettel scannen** – Foto von einem Zettel/Aushang hochladen, Termine
  werden per Texterkennung (OCR, im Browser) vorgeschlagen.
- **Verbundene Konten** – Google- oder Microsoft/Outlook-Konto verbinden,
  zeigt ungelesene Mails und anstehende Termine im Dashboard.
- **Assistent** – Chat-Button unten links, beantwortet Fragen zur Bedienung
  von Luma (Sprachbefehle, Wecker, Lernen, Installation, Daten …).
- **Einstellungen** – Benachrichtigungen aktivieren, Anleitung zum
  Homescreen-Installieren, Backup/Export der Daten.

Alle Daten werden lokal im Browser gespeichert (`localStorage`) – es gibt
keinen Server und kein Konto. Über die Einstellungen lässt sich ein
JSON-Backup exportieren und auf einem anderen Gerät wieder importieren.

## Entwicklung

```bash
npm install
npm run dev
```

Production-Build:

```bash
npm run build
npm run preview
```

## Auf dem Homescreen installieren

- **iPad/iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm"
- **MacBook (Safari/Chrome):** Menü öffnen → „Zum Dock hinzufügen" bzw. App
  installieren

## Technische Hinweise

- **Sprachfunktion:** nutzt die Web Speech API (`webkitSpeechRecognition`)
  und `chrono-node` (deutsches Locale) zum Erkennen von Datum/Uhrzeit aus
  gesprochenem Text. Unterstützt in Safari (iOS/iPadOS/macOS) und Chrome;
  benötigt Mikrofonzugriff.
- **Benachrichtigungen & Wecker:** über die Web Notifications API und Web
  Audio (Signalton). Sie funktionieren, solange Luma geöffnet ist (Tab oder
  installierte App) – ein Wecker klingelt also nicht, wenn die App komplett
  geschlossen ist. Auf iOS/iPadOS sind Web-Benachrichtigungen für
  installierte PWAs ab iOS/iPadOS 16.4 verfügbar.
- **Assistent:** ein lokaler, regelbasierter Hilfe-Assistent (kein externes
  LLM/keine Internetverbindung nötig) – erkennt Stichwörter in der Frage und
  gibt passende Bedienhinweise. Für einen "echten" KI-Chat (z. B. Claude)
  wäre ein eigenes Backend mit API-Key nötig, da GitHub Pages nur statische
  Dateien ausliefert.
- **Offline-fähig:** Service Worker cached die App für den Offline-Zugriff
  (`vite-plugin-pwa`).
- **Zettel scannen:** Texterkennung läuft komplett im Browser (`tesseract.js`,
  deutsches Sprachmodell). Engine, Worker und Sprachdaten werden selbst
  gehostet (kein externes CDN) und erst bei Nutzung nachgeladen.
- **Verbundene Konten:** clientseitiges OAuth (Google Identity Services bzw.
  `@azure/msal-browser` für Microsoft) – kein eigener Server, jede
  Installation braucht ihre eigene, kostenlos erstellbare Client-/
  Anwendungs-ID (Anleitung in den Einstellungen). Zugriffstoken liegen nur im
  `sessionStorage`, nicht dauerhaft gespeichert. iCloud/Apple Mail und
  klassische IMAP-Postfächer bieten keine für Websites nutzbare Schnittstelle
  und lassen sich deshalb nicht anbinden.
