# Phase 4.3 – Sprint 3 v6: Spielen-Modusauswahl

## Ziel

Der Bereich `Spielen` soll weder PokéIdle noch die Kampagne bevorzugen. Beide
Modi werden deshalb vor ihrem eigentlichen Inhalt als zwei gleich große,
eindeutig anwählbare Felder präsentiert.

## Umsetzung

- neue Spielen-Übersicht mit genau zwei gleichwertigen Moduskarten
- PokéIdle nutzt das bereits etablierte PokéIdle-Symbol
- die Kampagne nutzt die bestehende Kanto-Landschaft und zeigt ihren Fortschritt
- kurze Texte halten die Entscheidung übersichtlich
- PokéIdle wurde auf die eigene Unterroute `pokeidle` verschoben
- Kampagne und PokéIdle bleiben in der Hauptnavigation unter `Spielen` aktiv
- Zurück führt aus beiden Modi zur gemeinsamen Modusauswahl
- bestehende PokéIdle-Runden bleiben gespeichert und werden beim erneuten Öffnen fortgesetzt
- Desktop zeigt beide Karten nebeneinander; iPhone zeigt sie untereinander
- die neue Darstellung liegt in `play-mode-ui.js`, damit `app.js` innerhalb des Architektur-Budgets bleibt

## Kompatibilität

Datenschema `22` bleibt unverändert. Spielstände aus v5 werden ohne Migration
übernommen. Die neue Route enthält nur die Darstellungsposition; Kampagnen- und
PokéIdle-Fortschritt ändern sich nicht.

## Prüfung

- Syntaxprüfung aller JavaScript-Module
- vollständige automatisierte Testsuite
- eigene Prüfungen für exakt zwei Moduskarten, gleiche Desktop-Abmessungen,
  gestapelte iPhone-Darstellung, Touch-Ziele und Zurück-Navigation
- lokales Browser-Smoke-Testskript ist enthalten; die Ausführung benötigt ein
  lokal verfügbares Chrome/Chromium
