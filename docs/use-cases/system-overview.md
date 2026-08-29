# Gesamtübersicht

Das Diagramm zeigt die beiden fachlichen Rollen und den direkten Zugriff des Clients auf Google Sheets und Google Drive im Proof of Concept.

```mermaid
flowchart LR
    Artist[Künstler]
    Customer[Kunde]
    App[RentArt Client]
    Sheets[(Google Sheets\nDatabase)]
    Drive[(Google Drive\nImages)]

    Artist -->|Werke anlegen, bearbeiten, löschen| App
    Artist -->|Anfragen bearbeiten und Rückgaben bestätigen| App
    Customer -->|Galerie ansehen| App
    Customer -->|Reservierung anfragen oder zurückziehen| App

    App <-->|Fachliche Daten lesen und schreiben| Sheets
    App <-->|Bilder lesen und schreiben| Drive
```

## Grundidee

Beide Rollen arbeiten ausschließlich über die RentArt-App. Für den PoC vertrauen wir den freigeschalteten Google-Konten und verzichten auf eine zusätzliche Server-Schicht.
