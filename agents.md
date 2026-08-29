## Ziel

Baue eine kleine, installierbare Web-App als Progressive Web App.

Die Anwendung soll vollständig clientseitig laufen und als statische Website über GitHub Pages veröffentlicht werden.

## Technologischer Rahmen

Verwende:

- React
- TypeScript
- Vite
- PWA-Unterstützung

Wähle weitere Libraries und die interne Architektur selbstständig und möglichst einfach.

## Persistenz

Es gibt kein eigenes Backend und keine eigene Datenbank.

Persistente fachliche Daten werden über die Google Sheets API gespeichert und gelesen.

Google Sheets dient als einfacher Datenspeicher.

Das konkrete Datenmodell und die benötigten Sheets dürfen passend zur jeweiligen Funktion der Anwendung gestaltet werden.

## Dateien und Bilder

Bilder und andere Dateien werden über Google Drive gespeichert.

In Google Sheets sollen nur die notwendigen Referenzen auf diese Dateien gespeichert werden, nicht die Binärdaten selbst.

## Authentifizierung und Zugriff

Die Anwendung verwendet Google zur Anmeldung.

Der Client greift mit dem angemeldeten Google-Konto direkt auf Google Sheets und Google Drive zu.

Die tatsächlichen Zugriffsrechte werden über die Freigaben der verwendeten Google-Ressourcen geregelt.

Implementiere keine eigene Benutzerverwaltung und kein eigenes Passwortsystem.

Der OAuth-Client ist ein Client vom Typ Webanwendung. Seine öffentliche Client-ID liegt als GitHub-Repository-Variable `GOOGLE_CLIENT_ID` vor und wird beim Build als `VITE_GOOGLE_CLIENT_ID` bereitgestellt. Die Client-ID ist kein Secret; ein Client-Secret darf nie verwendet oder gespeichert werden.

## Sicherheit

Keine privaten Secrets oder Zugangsdaten in das Repository oder den ausgelieferten Client einbauen.

Alles, was im Frontend enthalten ist, muss als öffentlich einsehbar betrachtet werden.

Verwende für Google ausschließlich Mechanismen, die für öffentliche Browser-Anwendungen vorgesehen sind.

## Hosting & Sicherheit

Die Anwendung wird über GitHub Pages bereitgestellt. Das bedeutet, dass der Code in diesem Repo öffentlich einsehbar ist. Speichere also nie Credentials oder sowas im Projekt, sondern verwende immer sichere Verfahren.

Richte eine geeignete GitHub-Actions-Pipeline ein, sodass Änderungen am vorgesehenen Branch automatisch gebaut und veröffentlicht werden.

GitHub Pages muss als Veröffentlichungsquelle **GitHub Actions** verwenden, nicht einen Repository-Branch. Die Action baut `dist` und veröffentlicht ausschließlich dieses Artefakt. Generierte Dateien wie `dist`, `sw.js`, `manifest.webmanifest`, `workbox-*` und gebündelte Dateien in `assets/` dürfen nicht ins Repository committed werden. Prüfe nach Änderungen immer den Status der GitHub Action.

## Entwicklungsprinzipien

Halte die Lösung möglichst klein und verständlich.

Bevorzuge einfache, etablierte Lösungen gegenüber komplexen Architekturen.

Treffe sinnvolle technische Entscheidungen selbstständig, solange sie die oben genannten Rahmenbedingungen einhalten.

Wenn eine konkrete Produktfunktion noch nicht definiert ist, erfinde keine umfangreiche Fachlogik. Schaffe stattdessen eine saubere Grundlage, auf der die eigentlichen Funktionen später aufgebaut werden können.

Dokumentiere und Aktualisiere alle Features in einer concept.md Datei mit und alle wichtigen Code-architektonischen Entscheidungen in einer architecture.md Datei. Dokumentiere so, dass ein fähiger Agent in der Lage ist, die bestehende App von Grund auf neu zu implementieren.
Es geht also v.a. um eine Highlevel Übersicht, nicht um jedes Detail.

## Initiales Ergebnis

Das erste Setup soll mindestens:

- lokal startbar sein
- erfolgreich builden
- als PWA installierbar sein
- über GitHub Pages deploybar sein
- Google-Anmeldung grundsätzlich unterstützen
- eine saubere Grundlage für Zugriffe auf Google Sheets und Google Drive bereitstellen
- eine kurze Dokumentation enthalten, welche Google-Konfiguration außerhalb des Repositories noch manuell vorgenommen werden muss
