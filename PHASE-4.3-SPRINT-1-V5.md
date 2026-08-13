# Phase 4.3 – Kampagnen-Grundsystem · Sprint 1 v5

## Anlass

Beim Wechsel der Professor-Berry-Tutorialschritte wurde das komplette
Dialog-Markup neu erzeugt. Gleichzeitig richtete Quizmon die Seite erneut auf
den nächsten Knoten aus. Dadurch sprang die Markierung sichtbar hoch und
runter, und der Wechsel wirkte wie ein kurzes Neuladen der Seite.

## Korrektur

- Das Berry-Fenster wird zu Tutorialbeginn einmal erzeugt und bleibt bis zum
  Abschluss als dasselbe Oberflächenelement bestehen.
- Schrittwechsel aktualisieren nur Titel, Erklärung, Fortschrittsanzeige,
  Schaltflächen und Zielkoordinaten.
- Die Kampagnenkarte wird vor dem Einblenden einmal passend ausgerichtet und
  bleibt danach über alle vier Schritte unverändert stehen.
- Die Markierungsreihenfolge verläuft ausschließlich nach unten: aktueller
  Knoten, besonderer Rivalenknoten, gesperrter Folgeknoten.
- Der Markierungskreis gleitet in 280 Millisekunden zum nächsten Ziel; Text und
  Fortschrittsanzeige wechseln mit einer kurzen dezenten Animation.
- Die Dialoghöhe bleibt auf Desktop und iPhone in allen Schritten konstant.
- Bei aktivierter Einstellung für reduzierte Bewegung werden die neuen
  Übergangsanimationen abgeschaltet.

## Absicherung

Der Browser-Smoke-Test prüft auf Desktop und iPhone ausdrücklich:

- identische Dialogelemente vor und nach jedem Schrittwechsel
- unveränderte Seiten- und Scrollposition
- unveränderte Dialogposition und -höhe
- ausschließlich abwärts gerichtete Zielwechsel
- vollständige Sichtbarkeit der Markierung oberhalb des Berry-Fensters
- weiterhin blockierte Maus-, Touch- und Tastaturbewegungen während des
  Tutorials

Alle übrigen Kampagnenfunktionen, gespeicherten Fortschrittsdaten und
Importstände aus v1 bis v4 bleiben kompatibel.
