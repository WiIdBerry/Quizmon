# Quizmon Beta 1.3

## Visual Refresh Sprint 3

Diese Version schließt den dreiteiligen Visual Refresh ab.

- Sprint 1: Designsystem, App-Rahmen und neue Startseite
- Sprint 2: Training, Quiz, Auswertung, Lernen und Lernkarten
- Sprint 3: Wissenswelt, Fortschritt, Trainerprofil, Optionen und appweiter Feinschliff

### Versionsstand

- Öffentliche Version: `Beta 1.3`
- Build: `visual-refresh-sprint3-v1`
- Datenschema: `19` (unverändert)
- Lernpfadversion: `3` (unverändert)
- Service Worker: `visual-refresh-sprint3-v1`

Die vollständige Beschreibung steht in `VISUAL-REFRESH-SPRINT-3.md`.

## Lokale Prüfung

```bash
npm run check
npm run test:browser
```

`npm run check` führt Syntax-, Daten-, Übersetzungs-, Speicher-, Lern-,
Wissenswelt-, PokéIdle-, PWA- und Visual-Refresh-Tests aus.

`npm run test:browser` prüft die Hauptabläufe mit Chrome auf Desktop und
Smartphone. In verwalteten lokalen Umgebungen kann dieser Test wegen einer
Browserrichtlinie übersprungen werden; im GitHub-Workflow bleibt er als
Veröffentlichungssperre aktiv.

## Start

`index.html` im Browser öffnen oder die Dateien über GitHub Pages bzw. einen
lokalen Webserver bereitstellen.
