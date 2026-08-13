# Phase 4.3 – Kampagnen-Grundsystem · Sprint 1 v2

## Ziel

Sprint 1 v2 stabilisiert die technische Grundlage vor dem Einbau spielbarer
Kampagnenmissionen. Die bereits in v1 umgesetzte Oberfläche und Bedienung
bleiben unverändert.

## Umgesetzt

- Kartenansicht, SVG-Pfad, Landschaftselemente und Missionsdetailbereich aus
  `app.js` nach `campaign-ui.js` ausgelagert
- vollständige Professor-Berry-Tutorialsteuerung nach `campaign-ui.js`
  ausgelagert
- klarer Aufbau:
  - `campaign.js`: Daten, Fortschritt und Regeln
  - `campaign-ui.js`: Darstellung und Tutorial
  - `app.js`: App-Zustand, Navigation und Systemverknüpfung
- neues Kampagnen-UI-Modul in Startreihenfolge, Syntaxprüfung und Offline-Cache
  aufgenommen
- v1-Spielstände und ältere unterstützte Importe bleiben kompatibel
- Datenschema bleibt unverändert bei 22

## Größenentwicklung

| Datei | Sprint 1 v1 | Sprint 1 v2 | Änderung |
|---|---:|---:|---:|
| `app.js` | 631.485 Byte | 618.025 Byte | −13.460 Byte |
| `app.js` | 8.541 Zeilen | 8.389 Zeilen | −152 Zeilen |
| `campaign-ui.js` | – | 14.677 Byte | neues isoliertes Modul |

Der neue Architekturwächter setzt für `app.js` eine Obergrenze von
620.000 Byte und 8.400 Zeilen. Zusätzlich prüft er, dass Karten-Markup,
Professor Berry und Tutorialimplementierung nicht wieder in `app.js`
landen.

## Unveränderte Sprintgrenze

Echte Kampagnenquizze, Starterentscheidung, Freischaltungsfortschritt,
Belohnungsvergabe und weitere Kanto-Abschnitte sind weiterhin nicht Teil von
Sprint 1.
