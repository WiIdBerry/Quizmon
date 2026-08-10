# Quizmon Beta 1.3

## Phase 4.1 – PokéIdle · Sprint 3 Korrektur v4

Diese Korrektur baut ausschließlich auf der getesteten Sprint-3-Korrektur
`Quizmon-Beta-1.3-Phase-4.1-Sprint-3-v3-Windows.zip` auf.

### Versionsstand

- Öffentliche Version: `Beta 1.3`
- Build: `4.1-sprint3-v4`
- Datenschema: `19`
- Lernpfadversion: `3` (unverändert)
- Service Worker: `4.1-sprint3-v4`

Der Bereich „Spielen“ enthält mit „PokéIdle“ seinen ersten vollständig
spielbaren Modus. Er umfasst drei Schwierigkeiten, fünf Leben, fünf
datenbasierte beziehungsweise mediale Hinweise, eine lokale Pokémon-Namenssuche,
eine gemeinsame Tagesrunde, XP, Statistiken sowie Gewinn- und Verlustauflösung.

Korrektur v2 benennt den Modus vollständig in PokéIdle um, ergänzt während einer
freien Runde den direkten Rückweg zur Schwierigkeitswahl, ordnet doppelte
Medienhinweise strikt nach steigender Aussagekraft und wertet einen gewonnenen
Tages-PokéIdle zugleich als abgeschlossenes Tagestraining im Hauptmenü.

Korrektur v3 behebt die von Suchvorschlägen verdeckte Bestätigungsaktion und
überarbeitet die Runde grundlegend: zentraler Hinweisbereich, kompakte
Fortschrittsspur, sichtbares Punktepotenzial, klarer Auswahlzustand und eine
strategische Vergleichsspur nach jedem Fehlversuch.

Korrektur v4 stimmt die Schwierigkeit „Einfach“ neu ab. Jede einfache Runde
verwendet nun dieselbe verständliche Steigerung: vollständiger Ruf, leichter
Faktenhinweis, deutlicher Faktenhinweis, klarer Schatten und großer farbiger
Bildausschnitt. Medienfehler oder stumme Nutzung werden weiterhin durch
eigenständige Faktenhinweise abgefangen. Normal und Schwer bleiben unverändert.

Die vollständige Änderungsbeschreibung steht in `PHASE-4.1-SPRINT-3.md`.

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
