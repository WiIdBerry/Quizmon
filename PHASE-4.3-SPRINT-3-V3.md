# Phase 4.3 – Sprint 3 v3: Visuelle Missionen

## Ziel

Die spielbaren Kanto-Missionen erhalten dieselbe visuelle Lernsprache wie die
Bereiche Lernen und Training. Pokémon werden bildlich dargestellt, Typen tragen
ihre bekannten Quizmon-Farben und die Missionsarten sind klarer unterscheidbar.

## Umsetzung

- 14 Pokémon des ersten Kapitels besitzen lokale SVG-Abbildungen.
- Pokémon-Bilder erscheinen im Aufgabenbereich oder direkt in passenden
  Antwortkarten.
- Typen werden über das bereits vorhandene Typ-Chip-System dargestellt.
- Forschungsmissionen verwenden Cyan/Blau, Trainermissionen Violett/Pink,
  Begegnungen Grün/Türkis, Routen Blau/Violett und Arenen Orange/Rot.
- Bildkarten, Evolutionspaare, Typkombinationen und Item-Antworten besitzen
  eigene lesbare Darstellungen.
- Desktop- und iPhone-Layout reagieren auf die neue Bildhöhe und erhalten
  ausreichend große Touchziele.
- Alle neuen Pokémon-Abbildungen werden vom Service Worker offline gespeichert.

## Didaktische Schutzregel

Eine Visualisierung darf keine Antwort vorwegnehmen. Bei einer Frage nach dem
Typ eines Pokémon zeigt die Antwort deshalb nur Bild und Namen. Farbige
Typ-Chips erscheinen im Fragetext nur für Typen, die dort bereits ausdrücklich
genannt werden. Diese Regel wird automatisiert geprüft.

## Technische Prüfung

- 222 Node-Tests bestanden.
- Browser-Smoke-Test auf Desktop und iPhone-Größe bestanden.
- Der Browser prüft für Alabastia echte geladene Bildbreiten und farbige
  Typ-Chips.
- Die mobile Prüfung kontrolliert Pokémon-Antwortkarten und die eigene
  Trainermissionsfarbe.
- Keine Browserausnahmen oder horizontale Überbreite festgestellt.

Sprint 3 bleibt bis zur ausdrücklichen Nutzerabnahme offen.
