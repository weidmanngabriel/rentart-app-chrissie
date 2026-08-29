# Reservierungsablauf

Der Kunde kann für ein verfügbares Werk eine Anfrage erstellen und diese zurückziehen, solange sie noch nicht angenommen wurde. Der Künstler kann die Anfrage annehmen oder ablehnen. Nach der Rückgabe wird das Werk wieder verfügbar. Der Künstler kann ein reserviertes Werk außerdem direkt löschen; die aktive Reservierung wird dabei automatisch beendet.

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
    Reserved --> Deleted : Künstler löscht Werk direkt
    Deleted --> [*]
```

## Status der Reservierung

```mermaid
flowchart LR
    Requested[REQUESTED] -->|Künstler nimmt an| Active[ACTIVE]
    Requested -->|Kunde zieht zurück| Cancelled[CANCELLED]
    Requested -->|Künstler lehnt ab| Cancelled
    Active -->|Werk zurückgegeben| Returned[RETURNED]
    Active -->|Künstler löscht Werk| Cancelled
```

Eine abgeschlossene oder stornierte Reservierung kann für die Historie im Sheet erhalten bleiben. Beim Löschen eines reservierten Werks wird die aktive Reservierung automatisch beendet, bevor das Werk entfernt wird. Für die Galerie zählt nur, ob aktuell eine offene oder aktive Reservierung für das Werk besteht.
