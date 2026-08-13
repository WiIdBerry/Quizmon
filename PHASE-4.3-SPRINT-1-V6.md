# Phase 4.3 – Kampagnen-Grundsystem · Sprint 1 v6

## Anlass

Die bisherigen Kartenknoten nutzten viele unterschiedliche, dünne
Lernmechanik-Piktogramme. Dadurch war auf der Kampagnenkarte nicht unmittelbar
erkennbar, ob ein Knoten einen Ort, einen wichtigen Kampf oder eine Belohnung
darstellt. Außerdem ersetzte der Abschluss-Haken das eigentliche Symbol.

## Neues Symbolsystem

Alle Kartenknoten verwenden nun eines von fünf zusammengehörigen,
transparenten SVG-Symbolen:

- Route: runder Tropfenmarker
- Stadt: kompakte Skyline
- Kampf: zwei gekreuzte Schwerter
- Belohnung: Schatztruhe
- Arena: Krone

Die Symbolart beschreibt ausschließlich den Ort oder das Ereignis. Der
Fortschritt wird unabhängig davon über den Knoten dargestellt:

- gesperrt: grau mit kleinem Schloss
- aktuell: blau, vergrößert und mit Leuchtring
- abgeschlossen: grün mit kleinem Haken
- verfügbar: blau ohne den starken Fokus des aktuellen Knotens

Das Hauptsymbol bleibt in jedem Zustand sichtbar. Schloss und Haken erscheinen
nur als kleine Abzeichen unten rechts.

## Zuordnung im ersten Kanto-Abschnitt

- Alabastia, Vertania City und Eichs Auftrag: Stadt
- erster Rivalenkampf: Kampf
- alle Routen-, Trainings-, Fang- und Waldabschnitte: Route
- erste Belohnung: Schatztruhe

Das Arenasymbol ist bereits vollständig eingebunden und offline verfügbar. Es
wird erst verwendet, sobald die Kampagne einen echten Arenaknoten enthält.

## Kompatibilität

Die bestehenden Knotentypen, IDs, Reihenfolge, Positionen und gespeicherten
Fortschrittsdaten bleiben unverändert. Die Tutorialkorrekturen aus v3 bis v5
werden vollständig übernommen.
