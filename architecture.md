# Architektur

RentArt ist eine rein clientseitige React-Anwendung mit TypeScript und Vite. Der Einstieg liegt in `src/main.tsx`, die Oberfläche in `src/App.tsx`; globale Gestaltung liegt in `styles.css`.

`index.html` ist der einzige Vite-Einstieg für Entwicklung und Produktionsbuild. Vite erzeugt daraus ausschließlich im Verzeichnis `dist` die statischen Dateien für GitHub Pages. Die GitHub-Action baut und veröffentlicht `dist` bei Änderungen auf `main`; erzeugte Dateien gehören nicht ins Repository.

`vite-plugin-pwa` erzeugt Manifest und Service Worker bei jedem Produktionsbuild. Die App benötigt kein eigenes Backend.

## Anmeldung

Die Anmeldung verwendet Google Identity Services im Browser. Der öffentliche OAuth-Web-Client wird über `VITE_GOOGLE_CLIENT_ID` konfiguriert. Für den GitHub-Pages-Build liest die Action den Wert aus der Repository-Variable `GOOGLE_CLIENT_ID`. Die Client-ID ist kein Secret; ein Client-Secret darf nicht im Frontend oder Repository liegen.

Die Verarbeitung des Google-Credentials liegt in `src/auth/google.ts`. Nach erfolgreicher Google-Anmeldung wird das von Google gelieferte ID-Credential nur für die aktuelle Browser-Sitzung in `sessionStorage` gehalten. Die Galerie wird nur bei einer gültigen, noch nicht abgelaufenen Sitzung gerendert. Logout entfernt diese Sitzung wieder.

Diese UI-Sperre ersetzt keine Datenberechtigung. Sobald Google Sheets und Google Drive angebunden werden, müssen die tatsächlichen Lese- und Schreibrechte weiterhin über Google OAuth und die Freigaben der jeweiligen Ressourcen durchgesetzt werden.

## Daten und Dateien

Persistente fachliche Daten werden später direkt über Google Sheets gelesen und geschrieben. Bilder und andere Dateien liegen in Google Drive; Sheets enthält nur die notwendigen Referenzen. Für diese APIs wird die bestehende Google-Anmeldung um die passenden OAuth-Berechtigungen erweitert.

## Externe Google-Konfiguration

Für eine funktionsfähige Anmeldung muss außerhalb des Repositories ein Google Cloud OAuth Client vom Typ Webanwendung angelegt werden. Als autorisierte JavaScript-Ursprünge werden mindestens `https://weidmanngabriel.github.io` und für lokale Entwicklung `http://localhost:5173` benötigt. Die erzeugte Client-ID wird lokal als `VITE_GOOGLE_CLIENT_ID` und für GitHub Pages als Repository-Variable `GOOGLE_CLIENT_ID` gesetzt.
