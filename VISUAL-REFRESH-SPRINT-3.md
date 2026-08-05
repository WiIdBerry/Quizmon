# Quizmon Beta 1.3 – Visual Refresh Sprint 3

## Ziel

Der neue visuelle Rahmen aus Sprint 1 und die überarbeiteten Lern- und
Trainingsabläufe aus Sprint 2 wurden auf die verbleibenden Hauptbereiche
übertragen. Der Sprint verändert keine Wissens-, Lern- oder Spieldaten.

## Umgesetzt

### Wissenswelt

- neue Wissenswelt-Hero-Fläche mit klarerer visueller Hierarchie
- Suche, Generationenfilter und persönliche Sammlung in das neue Kartensystem übertragen
- Kategorien, Kataloge, Trainer, Regionen und Competitive-Inhalte vereinheitlicht
- Pokémon-, Attacken-, Item- und weitere Detailseiten an die neue Formsprache angepasst
- einheitliche interaktive Zustände für Karten, Filter und Unterseiten
- neue gemeinsame Zurück- und Aufklapp-SVGs statt einzelner Textzeichen
- kompaktere mobile Katalog- und Detaildarstellung
- verbesserte Leere-, Lade- und Offlinezustände

### Fortschritt und Fehleranalyse

- neuer Fortschritts-Hero mit Level, XP, Trefferquote, Serie und offenen Fehlern
- moderne Tab-Leiste für Übersicht, Lernprofil, Typen, Fehler und Erfolge
- KPI-, Verlaufs-, Modus- und Typenkarten in das neue Designsystem übertragen
- Fehleranalyse, Fehlerheft und Erfolge visuell klarer voneinander getrennt
- persönliche Empfehlung bleibt priorisiert, Detailstatistiken bleiben nachrangig

### Trainerprofil und Sammlung

- Profil-Hero, Levelreise, Rekorde und nächste Belohnung neu inszeniert
- Sammlung, Favoriten, Kennzahlen und letzte Aktivität vereinheitlicht
- Profil-Dialoge und Auswahlkarten an das neue Oberflächensystem angepasst
- zentrale SVG-Symbole für Profilfortschritt und Rekorde

### Optionen

- neuer Optionen-Hero mit kompakter Übersicht der aktiven Einstellungen
- Einstellungsgruppen als klare, ruhige App-Bereiche statt einzelner Dashboardkarten
- einheitliche SVG-Symbole für Sprache, Design, Animation, Haptik, Hilfe, Daten und Reset
- verbesserte Auswahlfelder, Schalter, Aktionsbuttons und Gefahrenbereich
- eigenständige Desktop- und Smartphone-Anordnung

### Appweiter Feinschliff

- einheitliche Kartenrundungen, Rahmen, Schatten und Tiefenwirkung
- konsistente Hover-, Tastatur-, Touch- und Druckzustände
- überarbeitete Modal-, Toast-, Leere-, Lade- und Fehlerzustände
- eigenständige Regeln für helles und dunkles Design
- Responsive-Regeln für 860, 620 und 390 Pixel
- reduzierte Animationen und ausgeschaltete Animationen werden weiterhin respektiert

## Technische Änderungen

- Build: `visual-refresh-sprint3-v1`
- öffentliche Version bleibt `Beta 1.3`
- neues Stylesheet: `styles-visual-refresh-sprint3.css`
- Service-Worker-Cache und Registrierungskennung aktualisiert
- Exporte aus Visual Refresh Sprint 1 und Sprint 2 bleiben importierbar
- Browser-Smoke-Test um Fortschritt, Optionen, Themewechsel und Trainerprofil erweitert
- keine Änderung am Datenschema

## Nicht verändert

- Typen- und Quizlogik
- PokéIdle-Regeln
- Lernintelligenz und dynamische Schwierigkeit
- Fehleranalyse-Daten und Lernpfadfortschritt
- Wissensdaten und Learnsets
- Favoriten, Trainingslisten und Lernkarten-Daten
- XP, Level, Streak, Tagesziel und Freischaltungen
- Import- und Exportformat
