# Quizmon Beta 1.2 – Phase-3-Abschluss-Clean-up

## Grundlage

Technische Ausgangsversion:
`Quizmon-Beta-1.2-3.5-Sprint-2-v2-Windows.zip`

Öffentliche Version: `Beta 1.2`  
Interner Build: `phase3-cleanup-v1`  
Datenschema: `17` (unverändert)  
Lernpfadversion: `3` (unverändert)

## Ziel

Der Abschluss-Clean-up konsolidiert die vollständig umgesetzte Wissensplattform vor Phase 4. Er fügt keine neuen Roadmap-Funktionen hinzu und bewahrt sämtliche Lern-, Motivations-, Wissens- und Profilsysteme.

## UX und Informationsarchitektur

- Wissenswelt auf kleinen Displays verdichtet, ohne Inhalte zu entfernen.
- Persönliche Inhalte wie Favoriten und Trainingslisten in einem kompakten, bei Bedarf aufklappbaren Bereich gebündelt.
- Regionen, Trainer und Kampfgrundlagen in „Welt und Strategie“ progressiv gruppiert.
- Suche und aktiver Generationenfilter bleiben zuerst sichtbar.
- Lernkarten-Konfiguration zeigt nur Schritte, die für den gewählten Kartensatz relevant sind.
- Hauptmenü und Startseite bleiben unverändert die zentrale Navigation.
- Hauptmenü, untere Navigation und Seitenüberschriften verwenden einheitlich „Fortschritt“.
- Veraltete Hinweise auf zukünftige Lexikon-Sprints entfernt.
- Phase-3-Symbole für Suche, Favoriten, Trainingslisten, Lernkarten, Regionen, Trainer, Kampfgrundlagen, Items und Entwicklungen vereinheitlicht.

## Navigation und Accessibility

- Browser-Zurück und Smartphone-Zurückgeste in den internen Router integriert.
- Suchbegriff, Filter, Detailtab, Katalogseite und Scrollposition werden im Verlauf gesichert.
- Dialoge schließen sich vor einem Seitenwechsel; aktive Trainings werden weiterhin vor versehentlichem Verlassen geschützt.
- Wissensdetailseiten zeigen einen eindeutigen Wissenswelt-Kontext.
- wichtige Phase-3-Touchflächen auf mindestens 44 × 44 Pixel angehoben.
- Fokusführung, Escape-Verhalten, Sprunglink, kurze Screenreader-Ansagen und reduzierte Animationen bleiben erhalten.

## Performance und Offline

- Der rund 8,4 MB große vollständige Learnset-Datensatz wird nicht mehr bei jedem allgemeinen App-Start ausgewertet.
- Eine kompakte Metadatendatei hält Spieleauswahl und Verfügbarkeit sofort bereit.
- Vollständige Learnsets werden erst beim Öffnen eines Attackentabs oder einer Attacken-Rückbeziehung geladen und anschließend für die Sitzung wiederverwendet.
- Der vollständige Datensatz bleibt im Service-Worker-Kerncache und damit offline verfügbar.
- Lade-, Fehler- und Wiederholungszustand für das einmalige Learnset-Laden ergänzt.
- Nur noch eine zentrale Service-Worker-Registrierung.
- größerer Zeitrahmen für große lokale Kernassets; normale Netzwerkaufrufe behalten ihre bisherigen Grenzen.
- alte Quizmon-Caches werden beim Aktivieren weiterhin bereinigt.

## Datensicherheit und Wartbarkeit

- Phase-3-Reparatur für Favoriten, Trainingslisten und Lernkarten in ein testbares Modul ausgelagert.
- Importdateien werden vor Backuperstellung und Zustandsänderung zentral geprüft.
- bestehende Importgrößenbegrenzung bleibt erhalten.
- aktuelle und ältere unterstützte Builds bleiben importierbar.
- typisierte Bildfallbacks für Pokémon, Items und allgemeine Bilder vereinheitlicht.
- konkurrierende Inline-Bildfehlerbehandlung entfernt.
- bestätigter ungenutzter Code entfernt; kein grundlegender Umbau der App-Architektur.
- alte Sprint-Zwischenberichte aus dem auslieferbaren Hauptverzeichnis entfernt.

## GitHub-Absicherung

Der Veröffentlichungsworkflow führt vor der Veröffentlichung aus:

1. vollständige JavaScript-Syntaxprüfung,
2. sämtliche Modul-, Daten-, Import-, PWA- und Accessibility-Tests,
3. einen echten Chrome-Smoke-Test auf Desktop- und Smartphonebreite.

Der Smoke-Test prüft zentrale Navigation, Suche, Browser-Zurück, horizontale Überbreite, sichtbare Übersetzungsschlüssel und Touchflächen. Die Veröffentlichung hängt zwingend vom erfolgreichen Prüfjob ab.

## Bewusst unverändert

- alle vier Quizmodi und sämtliche Trainingsvarianten,
- Lernintelligenz, dynamische Schwierigkeit und Fehleranalyse,
- 20 Lernpfadmodule und Antworterklärungen,
- XP, Level, Tagesziel, Streak, Combos und „Noch eine Runde“,
- Pokémon-, Attacken-, Fähigkeiten-, Item-, Entwicklungs-, Regionen- und Trainerdaten,
- strikte Trennung der 21 Learnset-Spielgruppen,
- vollständige Trainerteams, Level und Spielreihenfolgen,
- Favoriten, Trainingslisten und persönliche Lernkarten,
- Datenschema 17 und Lernpfadversion 3.
