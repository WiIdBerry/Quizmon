# Phase 4.3 · Sprint 3 · Spielbare Kanto-Missionen v1

## Ziel

Die bisherige Kanto-Karte wird zum spielbaren Lernpfad. Jeder Orts- und
Ereignisknoten besitzt eine eigene Mission, deren Fragen ausschließlich aus dem
bestätigten Inhalt dieses Knotens stammen. Die Kapitelbelohnung bleibt für
Sprint 4 reserviert.

## Missionsregeln

- alle normalen Missionen: 10 Fragen, bestanden ab 8 richtigen Antworten
- Rocko in der Marmoria-Arena: 15 Fragen, bestanden ab 12 richtigen Antworten
- direkte Auswertung jeder Antwort mit kurzer inhaltlicher Erklärung
- nach Erfolg wird der Knoten grün und der nächste Pflichtknoten blau
- abgeschlossene Missionen können wiederholt werden
- nicht bestandene Missionen können sofort neu gestartet werden
- ein begonnener Versuch wird beim Verlassen nicht als Fortschritt gespeichert

## Ortsgebundene Inhalte

| Knoten | Mission | Zugelassener Inhalt |
| --- | --- | --- |
| Alabastia | Forschungsmission | Bisasam, Glumanda, Schiggy |
| Erster Rivalenkampf | Trainermission | die drei Starter und ihre Typenvorteile |
| Route 1 | Begegnungsmission | Taubsi, Rattfratz |
| Vertania City | Forschungsmission | Pokéball, Trank, Gegengift, Para-Heiler, Beleber |
| Route 22 | Routenmission, optional | Rattfratz, Habitak, Menki |
| Zweiter Rivalenkampf | Trainermission, optional | Starter und Taubsi |
| Route 2 | Routenmission | Raupy, Hornliu, Taubsi, Rattfratz |
| Vertania-Wald | Begegnungsmission | Raupy, Safcon, Hornliu, Kokuna, Pikachu |
| Rocko | Arenenmission | Kleinstein, Onix |

Pokémon-Entwicklungen außerhalb eines Orts werden nicht als Antwortoptionen
verwendet. Damit bleibt beispielsweise Route 1 vollständig auf Taubsi und
Rattfratz begrenzt.

## Fortschritt

Die Pflichtstrecke schaltet sich der Reihe nach frei. Nach Vertania City sind
Route 2 und der optionale Einstieg zu Route 22 gleichzeitig verfügbar. Route 22
öffnet den zweiten Rivalenkampf, verändert aber den aktuellen Pflichtknoten
nicht. Nach Rocko wird die Kapiteltruhe sichtbar und verfügbar dargestellt,
bleibt in diesem Sprint jedoch nicht anklickbar.

## Technik

`campaign-missions.js` erzeugt die zweisprachigen Fragen aus dem bestehenden
lokalen Pokémon-, Item- und Typendatensatz. `campaign.js` verwaltet eine aus den
gültigen Abschlüssen abgeleitete Freischaltungskette. `campaign-ui.js` enthält
Quiz, Sofortfeedback, Ergebnisansicht, Wiederholung und Abbruchschutz. Alle neuen
Dateien werden vom Service Worker offline bereitgestellt.
