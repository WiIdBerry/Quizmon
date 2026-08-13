# Phase 4.2 – Speedrun · Sprint 1

## Umfang

Speedrun ergänzt die vorhandenen Trainingsmodi Effektivität, Multiplikator,
Angriffswirkung und Pokémon-Typ. Die Option ist im jeweiligen Setup abschaltbar
und steht mit 30, 60 oder 90 Sekunden zur Verfügung. PokéIdle, Tagestraining,
Fehlerwiederholung und adaptive Einheiten starten keinen Speedrun.

## Ablauf

- 3–2–1–Los vor jeder Runde
- unbegrenzt neue Fragen bis zur Zeitgrenze
- absolute, an der Systemzeit gemessene Deadline, auch nach App-Wechsel
- dringliche Timerdarstellung in den letzten zehn Sekunden
- kurzes grünes oder rotes Feedback mit automatischer nächster Frage
- eine bei Zeitablauf noch nicht bestätigte Antwort wird nicht gewertet
- Ergebnis mit beantwortet, richtig, falsch, Genauigkeit und Bestleistung
- Aktionen für dieselbe Runde, eine andere Zeit oder die Rückkehr zum Training

## Speicherung und Belohnung

Bestleistungen und Verlauf werden für jede Kombination aus Modus und Dauer
getrennt gespeichert. Mehr richtige Antworten gewinnen; bei Gleichstand entscheidet
die höhere Genauigkeit. Bestehende Importdaten werden auf das neue Schema repariert.

Eine richtige Antwort gibt 10 XP und Fortschritt beim Tagesziel. Es gibt keinen
Combo-Bonus. Falsche Antworten geben weder XP noch Tagesfortschritt, werden aber
im Fehlerbuch gespeichert. Reguläre Modus-, Gesamt- und Lernereignisstatistiken
werden durch Speedrun nicht verändert.

## Oberfläche

Die Auswahl ist direkt in das vorhandene Trainingssetup integriert. Laufende
Runden zeigen Zeit, richtige und falsche Antworten. Persönliche Rekorde sind im
Setup und im Fortschrittsbereich sichtbar. Desktop- und iPhone-Layouts verwenden
die bestehenden Quizmon-Komponenten und ausreichend große Touch-Ziele.

## Technische Änderungen

- neues isoliertes Modul `speedrun.js`
- Datenschema 21 und Build `4.2-sprint1-v1`
- Offline-Cache um das Speedrun-Modul erweitert
- vollständige deutsche und englische Übersetzungen
- Unit-, Integrations- und Browser-Smoke-Tests für Desktop und iPhone
