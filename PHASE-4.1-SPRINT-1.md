# Quizmon Beta 1.3 – Phase 4.1 Sprint 1

## Ausgangsbasis

Die Umsetzung basiert ausschließlich auf der vollständig geprüften und
ausdrücklich abgenommenen Datei
`Quizmon-Beta-1.2-Phase-3-Abschluss-Clean-up-v1-Windows.zip`.

- Öffentliche Version: `Beta 1.3`
- Interner Build: `4.1-sprint1-v1`
- Datenschema: `18`
- Lernpfadversion: `3` (unverändert)

## Umgesetzter Spielmodus

Der bisherige Platzhalter „Spielen“ öffnet jetzt den später in „PokéIdle“ umbenannten Spielmodus.

- Auswahl zwischen Einfach, Normal und Schwer
- zufälliges Ziel aus allen 1.025 lokal vorhandenen Pokémon
- fünf Leben auf jeder Schwierigkeit
- fünf schrittweise freigeschaltete Hinweise
- erster Hinweis ist sofort sichtbar
- jeder gültige falsche Name kostet ein Leben und öffnet den nächsten Hinweis
- richtige Antwort beendet die Runde sofort
- fünfter Fehlversuch beendet die Runde als Niederlage
- klare Lösung mit Name, Pokédexnummer, Typen und Pokémon-Artwork
- nächste Runde mit derselben Schwierigkeit oder Rückkehr zur Auswahl

## Namenssuche und Schutz vor Raten

- lokale Suche in der eingestellten Sprache
- bis zu sechs passende Suchvorschläge
- Tastatur-, Maus- und Touchbedienung
- nur vollständige, tatsächlich vorhandene Pokémon-Namen werden angenommen
- leere oder ungültige Eingaben kosten kein Leben
- bereits geratene Namen kosten kein weiteres Leben
- Schreibweisen werden normalisiert, ohne falsche Namen als Fehlversuch zu werten

## Datenbasierter Hinweis-Pool

Sprint 1 verwendet genau 25 Hinweisarten aus den bereits geprüften lokalen
Quizmon-Daten. Dazu zählen unter anderem Basiswerte, Fähigkeiten, Maße,
Generation, Pokédexbereich, Typen, Kampfeigenschaften, Entwicklungsstufe,
Entwicklungsfamilie, Entwicklungsbedingungen und späte Namensmuster.

Die fünf Hinweise werden als Paket erzeugt:

1. charakteristischer, anspruchsvoller Hinweis
2. ergänzender indirekter Hinweis
3. zugänglicher eingrenzender Hinweis
4. starker daten- oder entwicklungsbasierter Hinweis
5. sehr deutliche letzte Hilfe

Für jedes Paket gelten feste Regeln:

- keine doppelten Hinweisfamilien
- frühe Hinweise zeigen das Pokémon nicht direkt
- Namensmuster und Entwicklungsfamilie mit Lücke erscheinen nur an Position 5
- Hinweis 1 lässt höchstens 12, 28 beziehungsweise 60 Kandidaten für Einfach,
  Normal beziehungsweise Schwer übrig
- Hinweis 1 und 2 gemeinsam lassen exakt ein Pokémon übrig
- Entwicklungsbedingungen werden einschließlich zusätzlicher Bedingungen
  sachlich korrekt beschrieben

## Speicherung und Kompatibilität

- gewählte Schwierigkeit und laufende Runde werden lokal gespeichert
- ein Neustart setzt eine begonnene Runde korrekt fort
- manipulierte Lebens-, Hinweis- oder Ratezähler werden aus den gültigen Tipps
  und Katalogdaten rekonstruiert
- alte abgenommene Quizmon-Spielstände bleiben importierbar
- vorhandene Lern-, Profil-, Favoriten-, Listen- und Lernkartendaten bleiben
  erhalten

## Oberfläche und Barrierefreiheit

- eigenständiges Beta-1.3-Design für Modusauswahl, Runde und Auflösung
- responsive Desktop- und iPhone-Anordnung
- alle primären mobilen Eingaben und Schaltflächen mindestens 44 Pixel hoch
- zugängliche Beschriftungen für Leben, Hinweise, Suche und Statusmeldungen
- helle und dunkle Darstellung über das bestehende Quizmon-System
- reduzierte Animationen werden weiterhin berücksichtigt
- Deutsch und Englisch vollständig schlüssel- und platzhaltergleich

## Bewusst für spätere Sprints zurückgestellt

Sprint 2:

- Schatten
- Pixelbilder
- Bild- und Zoomausschnitte
- Pokémon-Rufe
- weitere visuelle oder akustische Hinweise

Sprint 3:

- tägliches gemeinsames Pokémon
- globale Lösungsverteilung
- XP und Trainerfortschritt
- persönliche Modusstatistiken
- endgültiges Belohnungs- und Langzeitbalancing
