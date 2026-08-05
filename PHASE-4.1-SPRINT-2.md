# Quizmon Beta 1.3 – Phase 4.1 Sprint 2

## Build

- Öffentliche Version: `Beta 1.3`
- Interner Build: `4.1-sprint2-v1`
- Ausgangsversion: `Quizmon-Beta-1.3-Phase-4.1-Sprint-1-v1-Windows.zip`

## Umgesetzt

- Schatten-, Pixelbild-, Bildausschnitt- und Rufhinweise
- ein bis höchstens zwei Medienhinweise je Runde
- Medienhinweise ausschließlich an Position 4 oder 5
- getrennte Darstellungsstärken für Einfach, Normal und Schwer
- reproduzierbare Ausschnittwahl pro Pokémon und Hinweisposition
- Abspielen, erneutes Abspielen, Lautstärke und Stummschaltung für Rufe
- datenbasierte Ersatzhinweise bei fehlenden Medien oder stummer Nutzung
- Laufzeit-Zwischenspeicherung geladener Bilder und Audiodaten durch den Service Worker
- vollständige deutsche und englische Beschriftung
- Desktop- und iPhone-Anpassung ohne horizontalen Überlauf

## Unverändert

- fünf Leben und fünf Hinweise
- Hinweis 1 bleibt theoretisch allein lösbar
- Hinweis 1 und 2 sind gemeinsam eindeutig
- gültige, doppelte und fehlerhafte Eingaben werden wie in Sprint 1 behandelt
- laufende Runden bleiben lokal gespeichert

## Quellen

Die bereits verwendeten offiziellen PokeAPI-Repositories liefern die Pokémon-Artworks
und Rufe. Medien werden erst bei Bedarf geladen und danach im bestehenden begrenzten
Laufzeit-Cache gespeichert. Fehlt eine Datei oder die Verbindung, bleibt die Runde
durch den gespeicherten Ersatzhinweis vollständig spielbar.

## Sprintgrenze

Tagesrunde, globale Ergebnisverteilung, XP, persönliche Modusstatistiken und das
endgültige Gesamtbalancing bleiben für Phase 4.1 Sprint 3 reserviert.
