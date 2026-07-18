# Änderungsprotokoll

## 0.6.1 Alpha
- vollständige PWA-Installationsvorbereitung
- iOS- und Maskable-App-Icons
- geführte Installationshilfe
- verbesserter Offline-Navigationsfallback
- GitHub-Pages-Workflow
- Migration von 0.6-Spielständen

## 0.6 Alpha

### Design
- Alle 18 Typensymbole als neues, einheitliches SVG-System neu gezeichnet
- Bessere Erkennbarkeit in kleiner, großer, heller und dunkler Darstellung
- Quizkarten auf vier Kernmodi erweitert, ohne die Hauptnavigation zu vergrößern

### Training
- Neuer Modus **Wirkung bestimmen** für schnelle Einzel- und Doppeltyp-Matchups
- Sofort verständliche Rechnung bei Doppeltypen
- Schnellstart **Letztes Training wiederholen** auf der Startseite
- Keine direkten Wiederholungen innerhalb einer normalen Sitzung
- Tages- und Schwächentraining berücksichtigen den neuen Modus

### Daten und Statistik
- Pokémon-Fragen vermeiden kürzlich verwendete Pokémon und versuchen bei Ladefehlern mehrere Alternativen
- Größerer lokaler Pokémon-Cache
- Neue persönliche Trainingsempfehlung in der Statistik
- Wirkung-Quiz vollständig in Statistik, Fehlerheft, Wiederholung und Sitzungsverlauf integriert

### Technik
- Neuer Versionsspeicher `pokemonTypeLearner.v0.6.1`
- Migration aus 0.4, 0.3, 0.2 und 0.1
- Service-Worker-Cache auf v0.6 aktualisiert
