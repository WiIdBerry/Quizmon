# Quizmon Beta 1.3

## Phase 4.3 – Abschluss und Qualität · Sprint 5 v1

Diese Version baut ausschließlich auf dem zuletzt abgenommenen Stand
`Quizmon-Beta-1.3-Phase-4.3-Sprint-4-v4-Windows.zip` auf.

### Versionsstand

- Öffentliche Version: `Beta 1.3`
- Build: `4.3-sprint5-v1`
- Datenschema: `23`
- Lernpfadversion: `3` (unverändert)
- Service Worker: `4.3-sprint5-v1`

### Neu in Sprint 5 v1

- gestaffelte Missions-, Fragen-, Fehlerfeedback-, Freischaltungs- und Belohnungsanimationen
- vollständige Bewegungsreduktion über Systemeinstellung und Quizmon-Schalter
- gezieltes iPhone-Profil ohne teure Kartenfilter, Blur und dauerhafte Schattenanimationen
- semantische Fortschrittsanzeigen, Fokusführung, Pfeiltasten-Navigation und Hochkontrastmodus
- zuverlässige Rückkehr zur gespeicherten Kartenposition und zum richtigen Knoten
- robustere Wiederherstellung beschädigter Zahlen, Sterne, Zeitstempel und Fortschrittsketten
- beschädigte aktuelle Speicherstände blockieren die Suche nach älteren kompatiblen Ständen nicht mehr
- zusätzliche End-to-End-Logiktests für alle Missionstypen, beide Kampagnenpfade, Wiederholungen,
  einmalige Belohnungen, Speicherung, Altstand-Migrationen und Sonderfälle

Die Abschlussprüfung und der manuelle iPhone-Prüfplan stehen in
`PHASE-4.3-SPRINT-5-V1.md` und `IPHONE-MANUAL-CHECKLIST-SPRINT-5.md`.

### Basis aus Sprint 4 v4

### Neu in Sprint 4 v4

- Größe der Kartensterne bleibt unverändert bei 30 Pixel
- Abstand zwischen Sternreihe und Knotenkreis vollständig entfernt
- Sternreihe berührt jetzt direkt den oberen Rand normaler und aktueller Knoten

Die Positionskorrektur steht in `PHASE-4.3-SPRINT-4-V4.md`.

### Neu in Sprint 4 v3

- Kartensterne von 20 auf 30 Pixel vergrößert
- Sternreihe verbreitert und weiter nach oben versetzt
- Schatten und gelbes Leuchten für die größere Darstellung verstärkt
- Sterne bleiben vollständig oberhalb des jeweiligen Knotens

Die Größenkorrektur steht in `PHASE-4.3-SPRINT-4-V3.md`.

### Neu in Sprint 4 v2

- die kleinen beschreibenden Untertitel wurden vollständig von den Kartenknoten entfernt
- unter jedem Knoten bleibt nur der eindeutige Orts- oder Missionsname stehen
- die drei Bewertungssterne stehen jetzt direkt oberhalb des zugehörigen Knotens
- Kartensterne sind deutlich größer, kontrastreicher und unabhängig vom Knotentitel positioniert
- die optionale Kennzeichnung von Route 22 sitzt seitlich und kollidiert nicht mit den Sternen

Die visuelle Korrektur steht in `PHASE-4.3-SPRINT-4-V2.md`.

### Neu in Sprint 4 v1

- jede abgeschlossene Mission erhält abhängig vom ersten Durchlauf ein bis drei Sterne
- Bestwert, beste Sterne, letzter Wert, Versuche und Abschlusszeitpunkte bleiben gespeichert
- der nächste Pflichtknoten wird erst durch ein echtes Missionsergebnis freigeschaltet
- Erstabschluss, neue Sternstufen, Wiederholung und Bestwertverbesserung besitzen getrennte XP-Regeln
- Erstabschluss- und Sternbelohnungen werden durch eine eindeutige Belohnungsliste nur einmal vergeben
- Wiederholungen bleiben möglich und geben eine kleinere, missionsabhängige Trainingsbelohnung
- die Missionsauswertung zeigt Sterne, XP-Aufteilung, Bestwert und den neu freigeschalteten Knoten
- die Rückkehr führt automatisch zum gerade freigeschalteten beziehungsweise wiederholten Kartenknoten
- der Felsorden und 250 XP können nach Rocko genau einmal eingesammelt werden
- die Kapitelbelohnung schließt Kapitel 1 ab und schaltet den nächsten Kanto-Abschnitt als Vorschau frei
- alte Sprint-3-Speicherstände werden auf das neue Belohnungssystem migriert; verdiente einmalige XP werden einmal nachgetragen
- vollständige deutsche und englische Oberfläche für Sterne, Ergebnisse, Belohnungen und Kapitelabschluss

Die technische Umsetzung steht in `PHASE-4.3-SPRINT-4-V1.md`.

### Bereits enthalten aus Sprint 3 v6

- `Spielen` ist jetzt eine eigenständige Modusauswahl mit genau zwei gleichwertigen Karten
- PokéIdle und Kampagne besitzen jeweils eine große Bildfläche, eine kurze Erklärung und einen direkten Einstieg
- der frühere kleine Kampagnen-Banner über PokéIdle wurde vollständig entfernt
- PokéIdle besitzt eine eigene Unterroute; die Zurück-Navigation führt wieder zur Modusauswahl
- Kampagnenfortschritt erscheint kompakt direkt auf der Kampagnenkarte
- auf iPhone-Größe werden beide Moduskarten untereinander als große Touch-Ziele dargestellt
- der Spielen-Eintrag im Hauptmenü nennt jetzt PokéIdle und Kampagne gemeinsam

### Neu in Sprint 3

- neun Kartenknoten sind als ortsgebundene Missionen spielbar
- acht reguläre Knoten besitzen 10 feste Fragen; Rockos Arena enthält 15 Fragen
- die Zahl der Antworten wächst entlang der Lernkurve von zwei auf bis zu vier, bei Rocko bis auf fünf
- Frageauswahl und Reihenfolge bleiben bei Wiederholungen gleich; nur die Antwortpositionen wechseln
- jede Antwort erhält sofort eine Richtig-/Falsch-Auswertung mit Erklärung
- falsche Inhalte wechseln nach dem ersten Durchlauf in eine verpflichtende Fehler-Meistern-Runde
- Wiederholungsfragen sind neu formuliert; nach wiederholten Fehlern hilft eine fokussierte Zwei-Antworten-Auswahl
- erst wenn alle Fehler gemeistert sind, wird die Mission grün und der nächste Pflichtknoten freigeschaltet
- der Wert des ersten Durchlaufs bleibt für spätere Leistungs- und Sternelogik getrennt erhalten
- Route 22 und der zweite Rivalenkampf bleiben vollständig optional
- vollständige Missionswiederholungen bleiben jederzeit möglich
- laufende Versuche besitzen einen abgesicherten Abbruchdialog
- die Kapiteltruhe bleibt bis zum Abschluss von Rockos Arena gesperrt
- Fragen und Antwortoptionen werden strikt auf den jeweiligen Ort begrenzt
- vollständige deutsche und englische Missionsoberfläche
- Offline-Cache für das neue Missionsmodul
- pädagogische Lernreihenfolge statt zufälliger Detail- und Statistikfragen
- Alabastia ausschließlich mit Namen und Typen der drei Starter
- Typeneffektivität beginnt erst beim ersten Rivalenkampf
- örtliche Entwicklungen beginnen erst im Vertania-Wald
- feste Lernreihenfolge steuert Wiederholung, Einführung und Anwendung je Ort
- keine Basiswert-, Größen-, Gewichts-, Pokédexnummern- oder Levelabfragen
- echte Pokémon-Abbildungen in Aufgaben und passenden Antwortmöglichkeiten
- farbige Typ-Chips aus dem bestehenden Lernen- und Training-Design
- eigene Farbwelt für Forschungs-, Trainer-, Begegnungs-, Route- und Arenenmissionen
- exakt dieselben offiziellen Pokémon-Artworks wie in der Wissenswelt
- lokale, offline verfügbare PNG-Abbildungen aller 14 Pokémon des ersten Kapitels
- Typen und Pokémon-Eigenschaften werden nur dann visualisiert, wenn sie die Lösung nicht verraten

Die technische Grundlage steht in `PHASE-4.3-SPRINT-3-V1.md`.
Die verbindliche Fragenstruktur von v2 steht in
`PHASE-4.3-SPRINT-3-V2.md`.
Die visuelle Missionsüberarbeitung von v3 steht in
`PHASE-4.3-SPRINT-3-V3.md`.
Die vereinheitlichten Artworks und festen Fragensätze von v4 stehen in
`PHASE-4.3-SPRINT-3-V4.md`.
Die gestaffelte Lernkurve und Fehler-Meistern-Runde von v5 stehen in
`PHASE-4.3-SPRINT-3-V5.md`.
Die gleichwertige Spielen-Modusauswahl von v6 steht in
`PHASE-4.3-SPRINT-3-V6.md`.

### Bereits enthaltenes Kampagnen-Grundsystem

- ausschließliches dunkles Design in der gesamten App; die Designumschaltung ist entfernt
- neuer Kampagneneinstieg unter `Spielen`
- eigener Kampagnenbereich mit vertikalem Kanto-Pfad von oben nach unten
- zehn sichtbare Storyknoten von Alabastia bis zur Kapitelbelohnung nach Rocko
- acht Pflichtmissionen auf dem Hauptweg sowie Route 22 und der zweite Kampf
  gegen Blau als eigener optionaler Seitenzweig
- klar getrennte Zustände für aktuell, verfügbar, abgeschlossen und gesperrt
- besondere Gestaltung für Rivalen, Belohnungen, optionale Aufgaben und Kapitelabschlüsse
- vierstufiges Pop-up-Tutorial mit Professor Berry direkt über der Karte
- Professor Berry erscheint ausschließlich im Kampagnen-Tutorial
- Tutorialfortschritt und Kampagnen-Grundzustand werden gespeichert sowie exportiert/importiert
- Desktop-Detailbereich und mobile Missionsvorschau
- deutsche und englische Kampagnentexte
- Offline-Cache für Kampagnenmodul, Gestaltung und Professor-Berry-Asset
- Kampagnenkarte und Professor-Berry-Tutorial vollständig aus `app.js` in
  `campaign-ui.js` ausgelagert
- automatischer Architekturwächter verhindert neues Wachstum von `app.js`
- Tutorial-Schritt 1 bleibt ohne losgelösten Hervorhebungsrahmen
- Tutorial-Schritt 2 bis 4 markieren exakt den sichtbaren runden Knoten
- Zielmarkierung wird beim Scrollen, Drehen und Ändern der Fenstergröße nachgeführt
- Professor-Berry-Fenster sitzt auf Desktop deutlich höher über dem unteren Rand
- Browserprüfung findet zusätzlich Playwright-Chromium sowie Chrome und Edge unter Windows
- manuelles Scrollen ist während des Tutorials per Mausrad, Touch und Tastatur gesperrt
- die Karte wird vor Tutorialbeginn einmal passend ausgerichtet und bleibt danach über alle Schritte fest stehen
- ein einziges dauerhaftes Berry-Fenster aktualisiert nur Text, Fortschritt und Zielmarkierung
- die Zielmarkierung bewegt sich flüssig und ausschließlich nach unten: aktuell, besonders, gesperrt
- stabile Dialoghöhe auf Desktop und iPhone verhindert sichtbares Springen bei unterschiedlich langen Texten
- fünf einheitliche, transparente Kampagnensymbole für Route, Stadt, Kampf,
  Belohnung und Arena
- feste inhaltliche Symbolzuordnung je Kartenknoten statt wechselnder
  Lernmechanik-Piktogramme
- graue gesperrte Knoten mit Schloss, leuchtend blaue aktuelle Knoten und
  grüne abgeschlossene Knoten mit Haken
- das eigentliche Orts- oder Ereignissymbol bleibt auch nach dem Abschluss
  vollständig sichtbar
- hochwertige, durchgehende Kanto-Landschaft mit Küstenstadt, Wiesenroute,
  Vertania City, Wald, Felsgebiet und Marmoria-Arena
- Landschaft, interaktiver Leuchtpfad und Statusknoten bleiben als getrennte
  Ebenen responsiv und funktional

Eine dauerhafte Starterwahl bleibt bewusst außerhalb von Quizmon.

Die vollständige Funktionsbeschreibung steht in `PHASE-4.3-SPRINT-1.md`.
Die Architekturkorrektur von v2 ist zusätzlich in
`PHASE-4.3-SPRINT-1-V2.md` dokumentiert.
Die Tutorial- und Browserkorrekturen von v3 stehen in
`PHASE-4.3-SPRINT-1-V3.md`.
Die Scroll-Sperre von v4 steht in `PHASE-4.3-SPRINT-1-V4.md`.
Der flüssige, feste Schrittwechsel von v5 steht in
`PHASE-4.3-SPRINT-1-V5.md`.
Das neue Kartenknoten- und Symbolsystem von v6 steht in
`PHASE-4.3-SPRINT-1-V6.md`.
Die neue Landschaftskarte und die verbindliche Storyreihenfolge von v7 stehen in
`PHASE-4.3-SPRINT-1-V7.md`.

## Lokale Prüfung

```bash
npm run check
npm run test:browser
```

`npm run check` prüft Syntax, Daten, Übersetzungen, Speicherung, Import,
Kampagnenstruktur, Darkmode, Professor-Berry-Verwendung, Lernsysteme,
Wissensplattform, PokéIdle, Speedrun und PWA-Struktur.

`npm run test:browser` enthält vollständige Desktop- und iPhone-Abläufe für
Kampagne, Tutorial, Pfad, Touchgrößen und Überlauf. Der Test findet installierte
Chrome-, Edge-, Chromium- und Playwright-Browser automatisch. Ist keiner
vorhanden, kann er einmalig mit `npm run setup:browser` installiert werden. Die
enthaltene GitHub-Workflow-Prüfung installiert Chrome weiterhin automatisch.

## Start

`index.html` im Browser öffnen oder die Dateien über GitHub Pages beziehungsweise
einen lokalen Webserver bereitstellen.
