# Phase 4.3 · Sprint 4 v1

## Ziel

Sprint 4 verbindet die spielbaren Kampagnenmissionen mit echtem, dauerhaftem
Fortschritt. Sterne, XP, Belohnungen, Wiederholungen und Kapitelabschluss werden
nicht aus dem sichtbaren Kartenstatus abgeleitet, sondern aus gespeicherten
Missionsergebnissen.

## Sterne

Die Sterne beziehen sich ausschließlich auf den ersten Durchlauf einer Mission.
Die anschließende Fehler-Meistern-Runde schließt die Mission ab, verändert aber
nicht rückwirkend die Leistungsbewertung.

| Ergebnis | Sterne |
| --- | ---: |
| Mission abgeschlossen, direktes Ziel verfehlt | 1 |
| direktes Ziel erreicht (8/10, bei Rocko 12/15) | 2 |
| fehlerfreier erster Durchlauf | 3 |

Der beste Sternwert kann durch Wiederholungen steigen, aber niemals sinken.

## XP- und Wiederholungsregeln

| Ereignis | XP |
| --- | ---: |
| Erstabschluss normale Mission | 60 |
| Erstabschluss Rivalenkampf | 80 |
| Erstabschluss Arena | 150 |
| erster Stern | 20 |
| zweiter Stern | 30 |
| dritter Stern | 50 |
| Wiederholung normale Mission | 15 |
| Wiederholung Rivalenkampf | 20 |
| Wiederholung Arena | 30 |
| neuer Bestwert bei Wiederholung | 10 zusätzlich |
| Kapitelbelohnung | 250 |

Erstabschluss, einzelne Sternstufen und Kapitelbelohnung besitzen dauerhafte,
eindeutige Belohnungskennungen. Dadurch können sie auch nach Neuladen, Import
oder erneutem Spielen nicht doppelt vergeben werden. Die kleine
Wiederholungsbelohnung wird dagegen bei jedem vollständig beendeten Versuch
vergeben.

## Gespeicherter Kampagnenzustand

- letzter und bester Wert des ersten Durchlaufs
- letzter und bester Sternwert
- Zahl der abgeschlossenen Versuche
- erster und letzter Abschlusszeitpunkt
- abgeschlossene und freigeschaltete Knoten
- bereits beanspruchte einmalige Belohnungen
- insgesamt durch die Kampagne verdiente XP
- Kapitelabschluss und Freischaltung des nächsten Abschnitts
- zuletzt ausgewählter Knoten und Kartenposition

## Ergebnis- und Kartenübergang

Nach jeder Mission zeigt die Auswertung die aktuelle Sternbewertung, den
gespeicherten Bestwert, die XP-Aufteilung und gegebenenfalls den neu
freigeschalteten Knoten. `Zurück zur Karte` positioniert die Karte automatisch
auf diesem Knoten. Bei einer Wiederholung kehrt die Ansicht zur wiederholten
Mission zurück.

## Kapitelabschluss

Nach Rockos Arena wird die Kapiteltruhe aktiv. Das einmalige Einsammeln vergibt
den Felsorden und 250 XP, setzt den Kartenfortschritt auf 8/8 und speichert den
nächsten Kanto-Abschnitt `kanto-chapter-2` als freigeschaltet. Da dessen eigene
Karte noch nicht Teil dieses Sprints ist, erscheint zunächst eine eindeutige
Vorschau unter Kapitel 1.

## Migration

Speicherstände aus Sprint 3 bleiben kompatibel. Für bereits abgeschlossene
Missionen rekonstruiert die Migration Erstabschluss- und Sternbelohnungen aus
dem gespeicherten Bestwert. Die daraus entstehenden XP werden beim ersten Start
von Sprint 4 genau einmal dem globalen XP-Stand gutgeschrieben.
