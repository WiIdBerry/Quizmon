# Phase 4.3 · Sprint 1 · Kartenüberarbeitung v7

## Ziel

Version 7 ersetzt den abstrakten Kampagnenhintergrund durch eine hochwertige,
zusammenhängende Kanto-Landschaft. Der sichtbare Ablauf folgt der bestätigten
Storyreihenfolge und bleibt vollständig über interaktive HTML-, SVG- und
CSS-Ebenen steuerbar.

## Verbindliche Reihenfolge

1. Alabastia · Starterwahl
2. Erster Rivalenkampf gegen Blau
3. Route 1
4. Vertania City
5. Route 22 als optionaler Abzweig
6. Zweiter Rivalenkampf gegen Blau als optionale Zusatzprüfung
7. Route 2
8. Vertania-Wald
9. Rocko · Marmoria-Arena
10. Kapitelbelohnung

Der Hauptweg besteht aus acht Pflichtmissionen. Route 22 und der zweite
Rivalenkampf bilden einen gestrichelten, schwächer leuchtenden Seitenzweig, der
vor Route 2 wieder in den Hauptweg mündet. Beide Stationen blockieren den
Fortschritt nicht.

Kleinere Storyschritte wie Eichs Paket, die Rückkehr nach Alabastia, Pokédex,
Pokébälle und Fangtraining werden später als Missionsinhalte ihrer jeweiligen
Orte umgesetzt. Sie erzeugen keine zusätzlichen geografischen Kartenknoten.

## Darstellung

- hochauflösender, dunkler 2.5D-Landschaftshintergrund ohne eingebrannte UI
- eigenständiger SVG-Hauptpfad mit Leuchtspur und Fortschrittspunkten
- separater, gestrichelter Route-22-Zweig mit zwei Knoten
- zehn echte Schaltflächen mit den fünf freigegebenen Kartensymbolen
- weiterhin graue Sperren mit Schloss, blau leuchtender aktueller Knoten und
  grüne Abschlüsse mit Haken
- Arena-Krone bei Rocko und Schatztruhe am Kapitelabschluss
- dunkle Vignette und kompakte Beschriftungsflächen für sichere Lesbarkeit vor
  der detailreichen Landschaft

## Technik

Der Hintergrund liegt in
`assets/campaign-kanto-chapter-1-background.png` und wird vom Service Worker
offline zwischengespeichert. Pfade, Knoten, Zustände, Tastaturfokus, Tutorial-
Ziele und Missionsvorschau bleiben davon unabhängig. Dadurch kann die Karte
später fortgeschrieben werden, ohne die Landschaft erneut mit Statusgrafiken
rendern zu müssen.
