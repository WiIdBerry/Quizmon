# Phase 4.3 – Kampagnen-Grundsystem · Sprint 1 v3

## Ziel

Sprint 1 v3 behebt die sichtbaren Tutorialfehler aus v1, übernimmt die bereits
in v2 stabilisierte Modularchitektur und macht den vollständigen Browserlauf
lokal reproduzierbar.

## Tutorialkorrekturen

- Der Begrüßungsschritt 1/4 zeigt bewusst keinen Hervorhebungsrahmen.
- Schritt 2/4 markiert exakt den aktuellen leuchtenden Knoten.
- Schritt 3/4 markiert exakt einen gesperrten kommenden Knoten.
- Schritt 4/4 markiert exakt den besonderen Rivalenknoten.
- Fehlende Tutorialziele führen nie ersatzweise zu einem riesigen Kartenrahmen.
- Die Zielmarkierung folgt Scroll-, Fenstergrößen-, Ausrichtungs- und
  Größenänderungen.
- Der erklärte Knoten wird im oberen Bildschirmbereich positioniert, damit
  Markierung und Dialog sich nicht überdecken.
- Das Professor-Berry-Fenster sitzt auf Desktop deutlich höher; auf dem iPhone
  bleibt es sicher oberhalb der Hauptnavigation.

## Browserprüfung

Der Browser-Smoke-Test findet jetzt:

- explizite Pfade aus `CHROME_PATH`, `CHROMIUM_PATH` oder `BROWSER_PATH`
- Chrome, Edge und Chromium in üblichen Windows-Verzeichnissen
- Chrome, Edge und Chromium unter macOS und Linux
- vorhandene Playwright-Browser über das Playwright-Modul oder dessen Cache

Ist kein Browser vorhanden, installiert `npm run setup:browser` einmalig
Chromium. Ein fehlgeschlagener Browserstart beendet nun auch den temporären
lokalen Webserver sauber.

## Kompatibilität

- Datenschema bleibt 22.
- v1- und v2-Spielstände bleiben importierbar.
- Kampagnendaten, Texte, Knotenfolge und Professor-Berry-Asset bleiben
  unverändert.
- `app.js` bleibt unter dem festgelegten Architekturbudget.
- Es kommen keine spielbaren Missionen, XP-Belohnungen oder Freischaltungen
  hinzu.
