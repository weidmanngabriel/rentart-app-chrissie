# Reservierungsablauf

Der Kunde kann für ein verfügbares Werk eine Anfrage erstellen und diese zurückziehen, solange sie noch nicht angenommen wurde. Der Künstler kann die Anfrage annehmen oder ablehnen. Nach der Rückgabe wird das Werk wieder verfügbar.

```mermaid
stateDiagram-v2
    state "Verfügbar" as Available
    state "Angefragt" as Requested
    state "Reserviert" as Reserved
    state "Gelöscht" as Deleted

    [*] --> Available

    Available --> Requested : Kunde erstellt Anfrage
    Requested --> Available : Kunde zieht Anfrage zurück
    Requested --> Available : Künstler lehnt Anfrage ab
    Requested --> Reserved : Künstler nimmt Anfrage an
    Reserved --> Available : Künstler bestätigt Rückgabe

    Available --> Deleted : Künstler löscht Werk
    Deleted --> [*]
```

## Status der Reservierung

```mermaid
flowchart LR
    Requested[REQUESTED] -->|Künstler nimmt an| Active[ACTIVE]
    Requested -->|Kunde zieht zurück| Cancelled[CANCELLED]
    Requested -->|Künstler lehnt ab| Cancelled
    Active -->|Werk zurückgegeben| Returned[RETURNED]
```

Eine abgeschlossene oder stornierte Reservierung kann für die Historie im Sheet erhalten bleiben. Für die Galerie zählt nur, ob aktuell eine offene oder aktive Reservierung für das Werk besteht.
