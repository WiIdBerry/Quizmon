# Phase 4.3 – Kampagnen-Grundsystem · Sprint 1

## Ziel

Sprint 1 legt die visuelle und technische Basis für das künftige Herzstück von
Quizmon. Der Kampagnenbereich soll sich wie ein zusammenhängender Lernweg
anfühlen und bereits auf Desktop und iPhone klar beurteilt werden können, ohne
die Missionsintegration später durch ein starres Kartenbild einzuschränken.

## Verbindliche Gestaltung

- Quizmon verwendet ab diesem Build ausschließlich Darkmode.
- Der frühere Hell-/Dunkel-Schalter ist entfernt.
- Die Karte folgt einem zentralen, Duolingo-artigen Zickzackpfad.
- Der Weg beginnt oben und verläuft mit zunehmendem Fortschritt nach unten.
- Professor Berry erscheint nur im vierstufigen Karten-Tutorial.
- Nach Abschluss oder Überspringen des Tutorials ist Professor Berry auf der
  normalen Karte nicht mehr vorhanden.

## Kampagneneinstieg

Unter `Spielen` steht oberhalb von PokéIdle eine eigenständige Kampagnenkarte.
Sie öffnet die neue Route `campaign`. PokéIdle und seine bereits abgenommenen
Funktionen bleiben vollständig erhalten.

## Erster Kanto-Abschnitt

Der Prototyp zeigt seit v7 zehn Knoten in der bestätigten
Feuerrot-/Blattgrün-Reihenfolge:

1. Alabastia und Starterwahl
2. erster Rivalenkampf
3. Route 1
4. Vertania City
5. Route 22 als optionaler Seitenknoten
6. zweiter Rivalenkampf gegen Blau als optionale Zusatzprüfung
7. Route 2
8. Vertania-Wald
9. Rocko in der Marmoria-Arena
10. Kapitelbelohnung

Route 22 und der zweite Rivalenkampf bilden gemeinsam einen optionalen
Seitenzweig und gehören nicht zu den acht Pflichtmissionen. Eichs Paket,
Rückweg, Pokédex und Fangtraining werden als Missionsinhalte ihrer Orte
gebündelt. Alle Knoten besitzen stabile IDs, Typen, Reihenfolge, Koordinaten
sowie deutsche und englische Texte.

## Professor-Berry-Tutorial

Beim ersten Öffnen der Kampagne erscheinen vier Pop-up-Schritte direkt über
der sichtbaren Karte:

1. Karte und Richtung von oben nach unten
2. leuchtender aktueller Knoten
3. besondere Rivalen-, Belohnungs-, Arena- und Abschlussknoten
4. gesperrte kommende Knoten

Zur Verfügung stehen Zurück, Weiter, Tutorial überspringen und Reise starten.
Das Tutorial kann über die Optionen erneut geöffnet werden. Abschluss,
Überspringen und aktueller Schritt werden im Spielstand gespeichert.

## Technische Grundlage

- neues isoliertes Datenmodul `campaign.js`
- eigene Darstellungs- und Tutorialsteuerung in `campaign-ui.js`
- eigene responsive Gestaltung in `styles-campaign.css`
- neuer Routerzustand `campaign`
- Datenschema 22 mit reparierbarem Kampagnenzustand
- Export und Import übernehmen die Kampagnendaten automatisch
- Service Worker speichert Kampagnenmodul, CSS und Berry-Asset offline
- interaktive HTML-Knoten und skalierbare SVG-Verbindungen statt eines festen
  Kartenbildes
- Desktop mit dauerhaftem Missionsdetailbereich
- iPhone mit schließbarer Missionsvorschau über der Karte
- Touchziele der Knoten deutlich über 44 Pixel
- Bewegung respektiert weiterhin die Einstellung für Animationen und die
  Systemeinstellung für reduzierte Bewegung

## Architekturkorrektur in v2

Sprint 1 v2 verändert die sichtbare Kampagne nicht. Die in v1 noch in
`app.js` enthaltene Kartenansicht, Knotendarstellung, Missionsvorschau und
Professor-Berry-Tutorialsteuerung wurden vollständig nach `campaign-ui.js`
verschoben.

`app.js` erzeugt nur noch den Kampagnencontroller und ruft dessen
`render()`-Methode für die Route `campaign` auf. Ein automatischer
Architekturtest begrenzt `app.js` auf höchstens 620.000 Byte und 8.400 Zeilen
und verhindert, dass Kampagnen-Markup oder Tutorialimplementierung dorthin
zurückwandern.

Datenschema 22, Kampagnenzustand, Import/Export, Texte, CSS, Professor-Berry-
Asset und sichtbares Verhalten bleiben unverändert.

## Tutorial- und Browserkorrektur in v3

Sprint 1 v3 korrigiert die anhand der Nutzerscreenshots festgestellten
Tutorialprobleme. Der erste Begrüßungsschritt zeigt keine Markierung. In den
Schritten zwei bis vier wird nicht mehr der unsichtbare Positionsanker eines
Knotens, sondern dessen tatsächlich sichtbare runde Schaltfläche vermessen.
Die Markierung folgt ihrem Ziel auch beim Scrollen, Drehen und Ändern der
Fenstergröße.

Das Professor-Berry-Fenster erhält auf Desktop einen deutlich größeren Abstand
zum unteren Bildschirmrand. Die mobile Position über der Hauptnavigation bleibt
erhalten. Der Browser-Smoke-Test prüft die exakte Übereinstimmung zwischen
Knoten und Markierung sowie die angehobene Fensterposition.

Die Browsererkennung unterstützt neben festen Linux-Pfaden nun auch Chrome und
Edge unter Windows, Chromium unter macOS und Browser aus dem Playwright-Cache.
Fehlt lokal ein Browser, steht `npm run setup:browser` zur Verfügung.

## Tutorial-Scroll-Sperre in v4

Sprint 1 v4 verhindert manuelles Verschieben der Kampagnenkarte, solange das
Professor-Berry-Tutorial geöffnet ist. Mausrad, Touch-Wischen, Page Up/Down,
Pfeiltasten, Pos1 und Ende lösen während der vier Schritte keine
Scrollbewegung aus. Die Tutorialsteuerung darf die Karte beim Wechsel des
Schrittes weiterhin automatisch auf den jeweils erklärten Knoten ausrichten.

Nach „Tutorial überspringen“ oder „Reise starten“ wird die Sperre vollständig
entfernt. Auch ein Verlassen der Kampagnenroute über den Browserverlauf räumt
die Sperre und die Positionsbeobachtung auf. Der Browser-Smoke-Test führt echte
Mausrad-, Tastatur- und Touch-Eingaben auf Desktop und iPhone aus.

## Flüssiger Schrittwechsel in v5

Sprint 1 v5 beseitigt den sichtbaren Neuaufbau zwischen den vier
Tutorialschritten. Das Professor-Berry-Fenster wird nur einmal erzeugt und
bleibt als dasselbe Oberflächenelement bestehen. Beim Wechsel werden nur Text,
Fortschrittsanzeige, Schaltflächenzustand und Zielkoordinaten aktualisiert.

Die Karte wird vor dem Einblenden des Tutorials einmal so ausgerichtet, dass
alle drei erklärten Knoten oberhalb des Dialogs sichtbar sind. Danach bleibt
die Scrollposition unverändert. Die Erklärreihenfolge lautet aktueller Knoten,
besonderer Rivalenknoten und gesperrter Folgeknoten. Dadurch bewegt sich die
Markierung ausschließlich nach unten und gleitet mit einer kurzen Animation
zum nächsten Ziel. Die Dialoghöhe bleibt auf Desktop und iPhone über alle
Schritte konstant; unterschiedlich lange Texte lösen keine Layoutsprünge mehr
aus. Reduzierte Bewegung wird weiterhin respektiert.

## Sprintgrenze

Noch nicht enthalten sind echte Kampagnenquizze, Starterentscheidung,
Freischaltungsfortschritt, einmalige Belohnungen, XP-Vergabe, Kapitelabschluss,
weitere Kanto-Abschnitte oder andere Regionen. Die sichtbaren Missionskarten
weisen deshalb ehrlich auf die spätere Missionsintegration hin.

## Abnahme

Dieser Sprint bleibt offen, bis Desktop- und iPhone-Darstellung vom Nutzer
geprüft und ausdrücklich abgenommen wurden.
