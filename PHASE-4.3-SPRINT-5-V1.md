# Phase 4.3 · Sprint 5 v1

## Ziel

Sprint 5 schließt das erste Kampagnenkapitel technisch und visuell ab. Der
verbindliche Ausgangspunkt ist Sprint 4 v4; Kartenstruktur, Fragen,
Lernkurve, Sterne und Belohnungsregeln bleiben erhalten.

## Animationen

- Missionen starten mit einer kurzen Kopf- und Kartenbewegung.
- Neue Fragen und Antworten erscheinen gestaffelt, ohne die Bedienung zu sperren.
- Richtig- und Falsch-Erklärungen erhalten eine kurze Statusbewegung.
- Sterne, XP-Karten und einmalige Belohnungen werden in der Auswertung nacheinander sichtbar.
- Neu freigeschaltete Knoten erhalten in der Auswertung und auf der Karte ein eindeutiges Signal.
- Kapitelbelohnung und nächster Abschnitt besitzen eine eigene Abschlusssequenz.
- Alle Effekte respektieren sowohl `prefers-reduced-motion` als auch den
  Quizmon-Schalter für Animationen.

## iPhone-Leistung

Unter iOS Safari und schmalen Viewports verwendet die Kampagne ein gezieltes
Leistungsprofil. Bild- und SVG-Filter, Backdrop-Blur, dauerhaft animierte
Kartenschatten und unnötige Artwork-Schatten werden deaktiviert. Das große
Kartenbild wird früh priorisiert und asynchron dekodiert; Touch-Bedienung und
mobile Detailbereiche sind für direktes Scrollen optimiert.

## Barrierefreiheit

- Karte und Missionen verwenden echte semantische Fortschrittsanzeigen.
- Fragen, Fehler-Meistern-Übergang, Ergebnisse und Kapitelabschluss besitzen
  gezielte Fokusziele.
- Antwortgruppen sind beschriftet und per Pfeiltasten durchlaufbar.
- Rückmeldungen und Kartenfreischaltungen werden höflich als Status gemeldet.
- Zustände werden zusätzlich zu Farben durch Text, Symbole und zugängliche
  Bezeichnungen vermittelt.
- Reduzierte Bewegung und Windows-Hochkontrastmodus sind berücksichtigt.
- Alle primären Touch-Ziele bleiben mindestens 44 Pixel groß.

## Stabilisierung und Speicherung

- Die gespeicherte Kartenposition wird beim Öffnen eines Knotens und vor einer
  Mission aktualisiert und nach einem Abbruch wiederhergestellt.
- Nicht-endliche oder übergroße XP- und Scrollwerte werden begrenzt.
- Sterne werden aus dem gespeicherten Bestwert neu abgeleitet.
- Ungültige oder rückwärts laufende Abschlusszeitpunkte werden repariert.
- Unmögliche Knotenketten, gefälschte Belohnungs-IDs und Kapitelzustände werden verworfen.
- Ist der aktuelle lokale Speicher syntaktisch beschädigt, prüft Quizmon noch
  vorhandene ältere kompatible Speicherstände, bevor ein leerer Stand verwendet wird.

## Automatisierte Abschlussabdeckung

Die zusätzliche Datei `tests/campaign-finalization.test.js` prüft:

1. alle fünf Missionstypen und jede geplante Frage,
2. den vollständigen Weg mit optionalem Zweig,
3. den Pflichtweg ohne Route 22,
4. Wiederholungs-, Bestwert- und Einmalbelohnungsregeln,
5. JSON-Speichern und Wiederherstellen,
6. einmalige Migration älterer Belohnungen,
7. beschädigte und widersprüchliche Kampagnendaten,
8. Animationsreduktion, Barrierefreiheitsmerkmale und iPhone-Leistungsprofil,
9. Kartenrückkehr und Fallback auf ältere Speicherstände.

Die physische Prüfung auf echten iPhones bleibt geräteabhängig und ist deshalb
als kurze manuelle Abnahme in `IPHONE-MANUAL-CHECKLIST-SPRINT-5.md` beschrieben.
