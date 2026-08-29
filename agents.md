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

## PoC-Datenbackend

Der Proof of Concept verwendet das Google Sheet `Database` mit der ID `12F0kf0pVO-DcOIwoVbR49SgdJGr-DSZl0CdU-jVVwpI` und den Drive-Ordner `Images` mit der ID `1D2MBmtvGUYpc4i8Hg9ul0ki34ObBezmv`.

Das Sheet enthält die Tabs `Users`, `Artworks` und `Reservations`.

Im Tab `Users` wird über die Google-E-Mail-Adresse festgelegt, welche fachliche Rolle ein Account im Frontend erhält. Erlaubte Rollenwerte sind exakt `artist` und `customer`. Zusätzlich muss `active` auf TRUE stehen. Ein Account ohne aktive gültige Rolle erhält keinen fachlichen Galerie-Zugriff.

Die Rollen sind im PoC eine UI- und Fachlogik, keine harte Sicherheitsgrenze. Alle freigegebenen Google-Konten gelten als vertrauenswürdig und dürfen technisch direkt auf die Google-Ressourcen zugreifen.

## Dateien und Bilder

Bilder und andere Dateien werden über Google Drive gespeichert.

In Google Sheets sollen nur die notwendigen Referenzen auf diese Dateien gespeichert werden, nicht die Binärdaten selbst.

## Authentifizierung und Zugriff

Die Anwendung verwendet Google zur Anmeldung.

Der Client greift mit dem angemeldeten Google-Konto direkt auf Google Sheets und Google Drive zu.

Die tatsächlichen Zugriffsrechte werden über die Freigaben der verwendeten Google-Ressourcen geregelt.

Implementiere keine eigene Benutzerverwaltung und kein eigenes Passwortsystem.

Der OAuth-Client ist ein Client vom Typ Webanwendung. Seine öffentliche Client-ID liegt als GitHub-Repository-Variable `GOOGLE_CLIENT_ID` vor und wird beim Build als `VITE_GOOGLE_CLIENT_ID` bereitgestellt. Die Client-ID ist kein Secret; ein Client-Secret darf nie verwendet oder gespeichert werden.

Google Identity Services trennt Anmeldung und API-Autorisierung. Das ID-Credential identifiziert den Nutzer; für Sheets und Drive fordert der Client zusätzlich ein kurzlebiges Access Token an. Das Access Token darf für die installierte PWA zusammen mit seiner Ablaufzeit lokal persistent gespeichert werden, damit ein Schließen und erneutes Öffnen der App den noch gültigen Datenzugriff nicht sofort verliert. Abgelaufene oder von Google abgelehnte Tokens müssen entfernt und erneut über eine Nutzeraktion angefordert werden. Vor dem Datenzugriff wird geprüft, dass Login und API-Autorisierung dieselbe Google-E-Mail-Adresse verwenden.

Für den PoC werden die OAuth-Scopes `openid`, `email`, `profile`, `https://www.googleapis.com/auth/spreadsheets` und `https://www.googleapis.com/auth/drive` verwendet.

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

`concept.md` und `architecture.md` sind bei jeder relevanten Änderung verbindlich zu beachten. Vor einer Implementierung muss geprüft werden, ob die geplante Änderung mit dem dort dokumentierten Produktkonzept und der bestehenden Architektur übereinstimmt.

Halte beide Dateien dauerhaft auf dem aktuellen Stand. Ergänze neue fachliche Funktionen in `concept.md` und wichtige technische bzw. architektonische Entscheidungen in `architecture.md`. Aktualisiere bestehende Aussagen, wenn sich Verhalten oder Aufbau ändern, und entferne Inhalte, die nicht mehr dem tatsächlichen Stand der Anwendung entsprechen.

Die Dokumentation soll so gepflegt werden, dass ein fähiger Agent die bestehende App und ihre wichtigsten Produkt- und Architekturentscheidungen schnell verstehen und im Zweifel von Grund auf neu implementieren könnte. Es geht vor allem um eine belastbare Highlevel-Übersicht, nicht um jedes Detail.

## Initiales Ergebnis

Das erste Setup soll mindestens:

- lokal startbar sein
- erfolgreich builden
- als PWA installierbar sein
- über GitHub Pages deploybar sein
- Google-Anmeldung grundsätzlich unterstützen
- eine saubere Grundlage für Zugriffe auf Google Sheets und Google Drive bereitstellen
- eine kurze Dokumentation enthalten, welche Google-Konfiguration außerhalb des Repositories noch manuell vorgenommen werden muss
