# Klarblick

Dein persönliches Cockpit für Alltag, Termine und Lernen – als installierbare
Web-App (PWA), die auf iPad, iPhone und MacBook über den Browser läuft und
vom Homescreen aus gestartet werden kann.

## Funktionen

- **Übersicht (Dashboard)** – heutige Termine, offene Erinnerungen und
  Lernfortschritt auf einen Blick.
- **Kalender** – Monatsansicht, Termine manuell oder **per Sprachbefehl**
  anlegen (z. B. „Termin morgen um 15 Uhr Zahnarzt").
- **Lernen** – Karteikarten-Decks mit einfacher Wiederholung nach
  Lernfortschritt (SM-2-artiges Scheduling).
- **Erinnerungen** – Aufgabenliste mit Fälligkeit, Priorität und
  Browser-Benachrichtigungen.
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
- **Benachrichtigungen:** über die Web Notifications API. Sie funktionieren,
  solange Klarblick geöffnet ist (Tab oder installierte App). Auf iOS/iPadOS
  sind Web-Benachrichtigungen für installierte PWAs ab iOS/iPadOS 16.4
  verfügbar.
- **Offline-fähig:** Service Worker cached die App für den Offline-Zugriff
  (`vite-plugin-pwa`).
