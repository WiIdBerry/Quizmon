# Phase 4.3 – Kampagnen-Grundsystem · Sprint 1 v4

## Ziel

Sprint 1 v4 verhindert, dass die hervorgehobenen Kartenbereiche durch
manuelles Scrollen während des Professor-Berry-Tutorials verrutschen.

## Verhalten

- Beim Öffnen des Tutorials wird das Scrollen der Seite gesperrt.
- Mausrad, Touch-Wischen und scrollende Tastatureingaben werden blockiert.
- Leertaste und Enter bleiben für die sichtbaren Tutorial-Schaltflächen nutzbar.
- Beim Schrittwechsel positioniert die Tutorialsteuerung den erklärten Knoten
  weiterhin automatisch im vorgesehenen oberen Bildschirmbereich.
- „Tutorial überspringen“ und „Reise starten“ entfernen die Sperre sofort.
- Ein Verlassen der Kampagnenroute über den Browserverlauf räumt die Sperre
  ebenfalls auf.

## Technische Grenze

Die Änderung liegt vollständig in `campaign-ui.js` und
`styles-campaign.css`. `app.js` enthält weiterhin nur die Kampagnenanbindung
und wächst nicht um Tutoriallogik. Datenschema, Kampagnenfortschritt,
Knoteninhalte, Gestaltung und Importkompatibilität bleiben unverändert.

## Prüfung

- 205/205 automatische Node-Prüfungen bestanden.
- Echter Chromium-Lauf auf 1.440 × 1.000 Pixel bestanden.
- Echter Chromium-Lauf auf 390 × 844 Pixel bestanden.
- Mausrad, Page Down und Touch-Wischen verändern die Kartenposition während
  des Tutorials nicht.
- Nach Abschluss oder Überspringen ist die Scroll-Sperre nicht mehr aktiv.
