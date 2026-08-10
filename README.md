# Quizmon Beta 1.3

## Phase 4.1 – Who's That Pokémon · Sprint 2

Diese Version baut ausschließlich auf der ausdrücklich abgenommenen Datei
`Quizmon-Beta-1.2-Phase-3-Abschluss-Clean-up-v1-Windows.zip` auf.

### Versionsstand

- Öffentliche Version: `Beta 1.3`
- Build: `4.1-sprint2-v1`
- Datenschema: `18`
- Lernpfadversion: `3` (unverändert)
- Service Worker: `4.1-sprint2-v1`

Der Bereich „Spielen“ enthält mit „Who's That Pokémon“ seinen ersten vollständig
spielbaren Modus. Sprint 1 umfasst drei Schwierigkeiten, fünf Leben, fünf
datenbasierte Hinweise, eine lokale Pokémon-Namenssuche, Gewinn- und
Verlustauflösung sowie die sichere Fortsetzung laufender Runden.

Hinweis 1 ist charakteristisch genug für eine mögliche frühe Lösung. Die
Kombination aus Hinweis 1 und 2 wird gegen den vollständigen Katalog geprüft und
ist eindeutig. Visuelle Hinweise und Pokémon-Rufe folgen planmäßig erst in
Sprint 2; Tagesrunde, XP und Modusstatistiken folgen in Sprint 3.

Die vollständige Änderungsbeschreibung steht in `PHASE-4.1-SPRINT-1.md`.

## Lokale Prüfung

```bash
npm run check
npm run test:browser
```

`npm run check` prüft Syntax, Daten, Übersetzungen, Speicherung, Import,
Lernsysteme, Wissensplattform, Who's-That-Logik und PWA-Struktur.

`npm run test:browser` prüft die zentralen Desktop- und Smartphone-Abläufe,
einschließlich einer vollständigen Who's-That-Runde. Im GitHub-Workflow wird
Chrome eingerichtet und der Browsertest als Veröffentlichungssperre ausgeführt.

## Start

`index.html` im Browser öffnen oder die Dateien über GitHub Pages beziehungsweise einen lokalen Webserver bereitstellen.
