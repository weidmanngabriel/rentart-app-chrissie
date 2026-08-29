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
    K -->|Ja| L[Löschen nicht möglich]
    L --> M[Zuerst Rückgabe abschließen]
    M --> B
    K -->|Nein| N[Werk aus Database löschen]
    N --> O[Zugehöriges Bild aus Images löschen]
```

## PoC-Regel

Ein Werk mit aktiver Reservierung wird nicht gelöscht. Nach bestätigter Rückgabe ist es wieder verfügbar und kann anschließend gelöscht werden.
