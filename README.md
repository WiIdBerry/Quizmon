# Quizmon Beta 1.3

## Visual Refresh · Sprint 2 v1

Diese Version baut ausschließlich auf der ausdrücklich abgenommenen Version
`Quizmon-Beta-1.3-Visual-Refresh-Sprint-1-v1-Windows.zip` auf.

### Versionsstand

- Öffentliche Version: `Beta 1.3`
- Build: `visual-refresh-sprint2-v1`
- Datenschema: `19` (unverändert)
- Lernpfadversion: `3` (unverändert)
- Service Worker: `visual-refresh-sprint2-v1`

Sprint 2 überträgt das neue Designsystem auf Training, Konfiguration, laufende
Quizfragen, Antwortauswertung, Rundenabschluss, Lernbereich, Lernpfad und
Lernkarten. Die vollständige Beschreibung steht in
`VISUAL-REFRESH-SPRINT-2.md`.

## Lokale Prüfung

```bash
npm run check
npm run test:browser
```

`npm run check` prüft Syntax, Daten, Übersetzungen, Speicherung, Import,
Lernsysteme, Wissensplattform, PokéIdle-Logik und PWA-Struktur.

`npm run test:browser` prüft die zentralen Desktop- und Smartphone-Abläufe,
einschließlich einer vollständigen PokéIdle-Runde. Im GitHub-Workflow wird
Chrome eingerichtet und der Browsertest als Veröffentlichungssperre ausgeführt.

## Start

`index.html` im Browser öffnen oder die Dateien über GitHub Pages beziehungsweise einen lokalen Webserver bereitstellen.
