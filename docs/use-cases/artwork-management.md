# Werkpflege durch den Künstler

Der Künstler pflegt Werke vollständig über den RentArt-Client. Bilder werden in Google Drive gespeichert; das Google Sheet enthält die fachlichen Daten und die Referenz auf die Bilddatei.

```mermaid
flowchart TD
    A[Künstler meldet sich mit Google an] --> B[Künstlerbereich]
    B --> C{Aktion wählen}

    C -->|Neues Werk| D[Werkdaten eingeben]
    D --> E[Bild auswählen]
    E --> F[Bild in Drive-Ordner Images hochladen]
    F --> G[Werkdaten und Drive-Datei-ID in Database speichern]
    G --> H[Werk ist in der Galerie verfügbar]

    C -->|Werk bearbeiten| I[Bestehendes Werk öffnen]
    I --> J[Daten oder Bild ändern]
    J --> G

    C -->|Werk löschen| K{Aktive Reservierung?}
    K -->|Nein| N[Werk aus Database löschen]
    K -->|Ja| L[Aktive Reservierung automatisch beenden]
    L --> N
    N --> O[Zugehöriges Bild aus Images löschen]
```

## PoC-Regel

Ein Werk darf auch mit aktiver Reservierung direkt gelöscht werden. In diesem Fall beendet die Anwendung die aktive Reservierung automatisch und löscht anschließend das Werk samt Bild. Der Künstler muss das Werk vorher nicht erst manuell auf verfügbar setzen.
