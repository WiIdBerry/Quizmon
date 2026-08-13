# Datenquellen der Wissensplattform

Der lokale Wissensdatenbestand wurde aus den strukturierten CSV-Daten des
offiziellen PokeAPI-Datenprojekts erzeugt.

Verwendet wurden insbesondere Daten zu:

- Pokémon-Spezies, Namen, Typen, Maßen und Basiswerten
- Fähigkeiten und Pokémon-Fähigkeitsbeziehungen
- Attacken, Werten, Kategorien und Effekten
- Items und Itemeffekten
- Entwicklungsauslöser und Entwicklungsbedingungen
- Pokémon-Attacken-Beziehungen
- Maschinen
- Version-Gruppen und Editionen

## Spielabhängige Learnsets

Quizmon liefert Learnsets für 21 Version-Gruppen der Hauptreihe von Rot & Blau
bis Karmesin & Purpur. Jeder Datensatz bleibt vollständig von den anderen
Spielen getrennt. Eine Levelangabe, TM, VM/HM, TR oder andere Lernmethode wird
niemals aus einer anderen Edition übernommen.

In der Oberfläche erscheinen bei einem Pokémon beziehungsweise einer Attacke nur
Version-Gruppen, für die in den Quelldaten tatsächlich Beziehungen vorhanden
sind. Die Auswahl beschreibt damit den verwendeten Learnset-Datensatz und nicht
automatisch die Fangbarkeit des Pokémon in dieser Edition.

Quizmon liefert Namen, Beziehungen und Kerndaten lokal aus. Pokémon-Artworks und
Item-Sprites werden bei Bedarf geladen, begrenzt gecacht und bei fehlender
Verbindung durch lokale Platzhalter ersetzt.

Für die 14 Pokémon des ersten Kampagnenkapitels sind dieselben offiziellen
PokeAPI-Artworks lokal enthalten, die auch die Wissenswelt verwendet. Beide
Bereiche beziehen ihre Bildadresse über dieselbe Quizmon-Funktion. Dadurch
unterscheiden sich Kampagne und Wissenswelt weder in Motiv noch Stil; zugleich
bleiben diese ersten Kapitelbilder offline verfügbar.

## PokéIdle

Die datenbasierten Hinweise aus Phase 4.1 Sprint 1 werden ausschließlich aus den
bereits lokal geprüften Pokémon-, Typen-, Fähigkeiten- und Entwicklungsdaten
abgeleitet. Das System erzeugt keine unbelegten Verhaltens-, Farb- oder
Pokédextexte. Jede Hinweiskombination wird rechnerisch gegen alle 1.025
Katalogeinträge geprüft.

Visuelle Hinweise und Pokémon-Rufe sind nicht Teil dieses Sprints. Das Artwork
wird erst nach Abschluss einer Runde zur Auflösung geladen und erhält bei
fehlender Verbindung weiterhin den lokalen Pokémon-Platzhalter.

Pokémon und zugehörige Marken sind Eigentum ihrer jeweiligen Rechteinhaber.
Quizmon ist ein unabhängiges Lernprojekt und nicht mit Nintendo, Game Freak oder
The Pokémon Company verbunden.

## Regionen und wichtige Trainer

Die Struktur der neun Hauptregionen, ihrer Ligen und der wichtigen regionalen
Trainer wurde gegen etablierte Pokémon-Nachschlagewerke und offizielle
Spielinformationen geprüft. Quizmon konzentriert sich auf benannte, für Region,
Liga oder Handlung wichtige Figuren. Gewöhnliche NPCs werden bewusst nicht als
eigener Wissensbestand aufgenommen.

Trainerbilder werden in diesem Sprint nicht extern geladen. Die Oberfläche nutzt
stattdessen ruhige Initialen-Karten, Typenfarben und verknüpfte Pokémon. Dadurch
bleibt der Bereich schnell, offline-tauglich und visuell konsistent.

## Kampf- und Competitive-Grundlagen

Die Texte zu STAB, Attackenkategorien, Initiative und Priorität, Wechselspiel,
Statusproblemen, Rollen, Coverage, Synergie, Basiswerten, IV, EV, Wesen, Wetter,
Feldeffekten, Eintrittsgefahren und Schutzschirmen sind eigene kompakte
Quizmon-Erklärungen.

Der Bereich enthält ausschließlich dauerhafte Grundlagen. Wechselnde Tier-Listen,
aktuelle Turnier-Metagames, konkrete VGC-Regelsets und fertige Teams sind nicht
Bestandteil dieses Sprints.

### Reihenfolge und vollständige Kampfteams

Die Reihenfolge der Arenaleiter sowie die vollständigen Teams von Arenaleitern,
Top-Vier-Mitgliedern und Champions wurden für Sprint 3 v3 spielbezogen kuratiert
und gegen die jeweiligen Gym-Leader- und Elite-Four-Übersichten von Pokémon
Database geprüft.

Als einheitliche Referenz wurden pro Region überwiegend folgende Spiele genutzt:

- Kanto: Feuerrot und Blattgrün
- Johto: HeartGold und SoulSilver
- Hoenn: Omega Rubin und Alpha Saphir; Smaragd für Juan und Champ Wallace
- Sinnoh: Strahlender Diamant und Leuchtende Perle
- Einall: Schwarz und Weiß sowie Schwarz 2 und Weiß 2
- Kalos: X und Y
- Alola: Sonne und Mond sowie Ultrasonne und Ultramond
- Galar: Schwert und Schild
- Paldea: Karmesin und Purpur

Wo Teams durch Starterwahl oder Edition abweichen, zeigt Quizmon die verwendete
Referenzvariante direkt auf der Trainerdetailseite. Editionsabhängige
Arenaleiter werden nicht vermischt, sondern teilen sich denselben Platz in der
regionalen Reihenfolge.

## Generationenfilter

Der Generationenfilter verwendet ausschließlich bereits vorhandene lokale
Metadaten. Pokémon, Attacken, Fähigkeiten und Items werden nach ihrer in den
PokeAPI-Kerndaten hinterlegten Einführungsgeneration eingeordnet. Regionen
verwenden ihre fest zugeordnete Hauptspielgeneration; Trainer übernehmen die
Generation ihrer Region.

Eine Entwicklungslinie gilt für eine Generation als passend, wenn mindestens
ein Mitglied dieser Linie in der gewählten Generation eingeführt wurde. Dadurch
bleiben verzweigte und generationsübergreifende Linien fachlich vollständig,
ohne parallele Datenbestände anzulegen.

Typenwirkungen werden durch den Filter nicht historisiert. Quizmon verwendet
weiterhin einheitlich den aktuellen Regelstand der Pokémon-Hauptspiele und weist
darauf in der Oberfläche ausdrücklich hin.
