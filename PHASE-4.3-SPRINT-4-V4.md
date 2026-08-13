# Phase 4.3 · Sprint 4 v4

## Ziel

Die 30-Pixel-Sterne aus v3 sollen ohne sichtbare Lücke unmittelbar mit dem
runden Kartenknoten verbunden sein.

## Änderung

- Die Größe, Breite und horizontale Zentrierung der Sterne bleiben unverändert.
- Bei normalen Knoten wird die Sternreihe zehn Pixel nach unten verschoben.
- Beim größeren aktuellen Knoten wird sie ebenfalls zehn Pixel nach unten
  verschoben.
- Die Unterkante der Sternreihe liegt dadurch direkt an der Oberkante des
  jeweiligen Knotenkreises.
- Der Browser-Smoke-Test akzeptiert höchstens einen Pixel Rundungsabweichung
  zwischen beiden Elementen.

Sterneberechnung, XP, Belohnungen und gespeicherter Fortschritt bleiben
unverändert.
