# Architektur

RentArt ist eine rein clientseitige React-Anwendung mit TypeScript und Vite. Der Einstieg liegt in `src/main.tsx`, die Oberfläche in `src/App.tsx`; globale Gestaltung liegt in `styles.css`, ergänzende Styles für die Google-Anmeldung in `src/auth.css`.

`index.html` ist der einzige Vite-Einstieg für Entwicklung und Produktionsbuild. Vite erzeugt daraus ausschließlich im Verzeichnis `dist` die statischen Dateien für GitHub Pages. Die GitHub-Action baut und veröffentlicht `dist` bei Änderungen auf `main`; erzeugte Dateien gehören nicht ins Repository.

`vite-plugin-pwa` erzeugt Manifest und Service Worker bei jedem Produktionsbuild. Die App benötigt kein eigenes Backend.

## Deployment

GitHub Pages verwendet **GitHub Actions** als Veröffentlichungsquelle. Der Workflow installiert die Abhängigkeiten, führt `npm run build` aus und veröffentlicht anschließend nur das erzeugte `dist`-Artefakt. Generierte Build- und PWA-Dateien werden nicht versioniert. Nach jeder Änderung auf `main` muss der Workflow erfolgreich abgeschlossen sein.

## Anmeldung

Die Anmeldung verwendet Google Identity Services im Browser. Der öffentliche OAuth-Web-Client wird über `VITE_GOOGLE_CLIENT_ID` konfiguriert. Für den GitHub-Pages-Build liest die Action den Wert aus der Repository-Variable `GOOGLE_CLIENT_ID`. Die Client-ID ist kein Secret; ein Client-Secret darf nicht im Frontend oder Repository liegen.

Die Verarbeitung des Google-Credentials liegt in `src/auth/google.ts`. Nach erfolgreicher Google-Anmeldung wird das von Google gelieferte ID-Credential nur für die aktuelle Browser-Sitzung in `sessionStorage` gehalten. Die Galerie wird nur bei einer gültigen, noch nicht abgelaufenen Sitzung gerendert. Logout entfernt diese Sitzung wieder.

An- und Abmeldung sind zentral im Header untergebracht. Im ausgeloggten Zustand rendert Google Identity Services dort den Google-Anmeldebutton. Im eingeloggten Zustand wird das Google-Profil als kompakter Konto-Button dargestellt. Das native `details`/`summary`-Kontomenü zeigt Name, E-Mail-Adresse und die Abmeldeaktion und bleibt dadurch auch auf schmalen Displays erreichbar. Der geschützte Galerie-Bereich enthält keine zweite Login- oder Logout-Steuerung.

Diese UI-Sperre ersetzt keine Datenberechtigung. Sobald Google Sheets und Google Drive angebunden werden, müssen die tatsächlichen Lese- und Schreibrechte weiterhin über Google OAuth und die Freigaben der jeweiligen Ressourcen durchgesetzt werden.

## PoC-Vertrauensmodell

Für den Proof of Concept gibt es nur feste, bekannte und vertrauenswürdige Google-Konten. Diese Konten erhalten die notwendigen Freigaben für die verwendeten Google-Ressourcen und greifen direkt aus dem Browser-Client darauf zu. Es wird bewusst keine zusätzliche Backend- oder Autorisierungsschicht eingeführt.

Die fachlichen Rollen `Künstler` und `Kunde` bestimmen zunächst Oberfläche und erlaubte Abläufe in der Anwendung. Sie sind im PoC keine harte Sicherheitsgrenze gegenüber einem absichtlich manipulierten Client. Dieses vereinfachte Modell ist eine bewusste PoC-Entscheidung und muss vor einer Öffnung für nicht vertrauenswürdige Nutzer neu bewertet werden.

## Daten und Dateien

Persistente fachliche Daten werden später direkt über Google Sheets gelesen und geschrieben. Bilder und andere Dateien liegen in Google Drive; Sheets enthält nur die notwendigen Referenzen. Für diese APIs wird die bestehende Google-Anmeldung um die passenden OAuth-Berechtigungen erweitert.

Die fachlichen Abläufe und Zustandswechsel werden zusätzlich als Mermaid-Diagramme unter `docs/use-cases/` dokumentiert.

## Externe Google-Konfiguration

Für eine funktionsfähige Anmeldung muss außerhalb des Repositories ein Google Cloud OAuth Client vom Typ Webanwendung angelegt werden. Als autorisierte JavaScript-Ursprünge werden mindestens `https://weidmanngabriel.github.io` und für lokale Entwicklung `http://localhost:5173` benötigt. Die erzeugte Client-ID wird lokal als `VITE_GOOGLE_CLIENT_ID` und für GitHub Pages als Repository-Variable `GOOGLE_CLIENT_ID` gesetzt.
