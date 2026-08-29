# Use Cases

Diese Dokumentation beschreibt die zentralen Abläufe des RentArt-Proof-of-Concepts visuell mit Mermaid-Diagrammen.

## PoC-Annahmen

- Es gibt nur feste, bekannte und vertrauenswürdige Google-Konten.
- Nach Google-Login greift der Browser-Client direkt auf Google Sheets und Google Drive zu.
- Es gibt kein eigenes Backend und keine eigene Benutzerverwaltung.
- Google-Freigaben bestimmen, welche Konten grundsätzlich auf die Ressourcen zugreifen dürfen.
- Die Rollen `Künstler` und `Kunde` steuern im PoC hauptsächlich die Oberfläche und die fachlichen Abläufe. Sie sind keine harte Sicherheitsgrenze gegenüber einem absichtlich manipulierten Client.
- Fachliche Daten liegen im Google Sheet `Database`, Bilder im Drive-Ordner `Images`.

## Diagramme

1. [Gesamtübersicht](./system-overview.md)
2. [Werkpflege durch den Künstler](./artwork-management.md)
3. [Reservierungsablauf](./reservation-flow.md)

Die Diagramme sollen als gemeinsame Referenz für spätere Implementierungen dienen und bei Änderungen an den Abläufen mit aktualisiert werden.
