# Quizmon Beta 1.2

## Phase-3-Abschluss-Clean-up

Diese Version baut ausschließlich auf der ausdrücklich abgenommenen Datei
`Quizmon-Beta-1.2-3.5-Sprint-2-v2-Windows.zip` auf.

### Versionsstand

- Öffentliche Version: `Beta 1.2`
- Build: `phase3-cleanup-v1`
- Datenschema: `17` (unverändert)
- Lernpfadversion: `3` (unverändert)
- Service Worker: `phase3-cleanup-v1`

Phase 3 „Wissensplattform“ bleibt vollständig abgeschlossen. Der Clean-up konsolidiert UX, Navigation, Performance, Offlineverhalten, Datensicherheit, Accessibility und Tests. Es wurden keine Funktionen aus Phase 4 vorgezogen.

Die vollständige Änderungsbeschreibung steht in `PHASE-3-ABSCHLUSS-CLEAN-UP.md`.

## Lokale Prüfung

```bash
npm run check
npm run test:browser
```

`npm run check` prüft Syntax, Daten, Übersetzungen, Speicherung, Import, Lernsysteme, Motivation, Wissensplattform und PWA-Struktur.

`npm run test:browser` startet einen lokalen Chrome-Smoke-Test. In verwalteten Umgebungen, die Loopback- und Datei-URLs administrativ blockieren, meldet der Test den lokalen Ausschluss transparent. Im GitHub-Workflow wird Chrome eingerichtet und der Browsertest als Veröffentlichungssperre ausgeführt.

## Start

`index.html` im Browser öffnen oder die Dateien über GitHub Pages beziehungsweise einen lokalen Webserver bereitstellen.
