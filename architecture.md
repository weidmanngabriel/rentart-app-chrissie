# Architektur

RentArt ist eine rein clientseitige React-Anwendung mit TypeScript und Vite. Der Einstieg liegt in `src/main.tsx`, die Oberfläche in `src/App.tsx`; globale Gestaltung liegt in `styles.css`, ergänzende Styles für die Google-Anmeldung in `src/auth.css` und für die datenbasierte Galerie in `src/gallery.css`.

`index.html` ist der einzige Vite-Einstieg für Entwicklung und Produktionsbuild. Vite erzeugt daraus ausschließlich im Verzeichnis `dist` die statischen Dateien für GitHub Pages. Die GitHub-Action baut und veröffentlicht `dist` bei Änderungen auf `main`; erzeugte Dateien gehören nicht ins Repository.

`vite-plugin-pwa` erzeugt Manifest und Service Worker bei jedem Produktionsbuild. Die App benötigt kein eigenes Backend.

## Deployment

GitHub Pages verwendet **GitHub Actions** als Veröffentlichungsquelle. Der Workflow installiert die Abhängigkeiten, führt `npm run build` aus und veröffentlicht anschließend nur das erzeugte `dist`-Artefakt. Generierte Build- und PWA-Dateien werden nicht versioniert. Nach jeder Änderung auf `main` muss der Workflow erfolgreich abgeschlossen sein.

## Anmeldung und Google-Autorisierung

Die Anmeldung verwendet Google Identity Services im Browser. Der öffentliche OAuth-Web-Client wird über `VITE_GOOGLE_CLIENT_ID` konfiguriert. Für den GitHub-Pages-Build liest die Action den Wert aus der Repository-Variable `GOOGLE_CLIENT_ID`. Die Client-ID ist kein Secret; ein Client-Secret darf nicht im Frontend oder Repository liegen.

Die Verarbeitung des Google-ID-Credentials liegt in `src/auth/google.ts`. Nach erfolgreicher Google-Anmeldung wird dieses Credential nur für die aktuelle Browser-Sitzung in `sessionStorage` gehalten. Logout entfernt diese Sitzung wieder.

Anmeldung und API-Zugriff sind getrennt: `src/auth/googleAccess.ts` verwendet `google.accounts.oauth2.initTokenClient`, um ein kurzlebiges Access Token für Google Sheets und Google Drive anzufordern. Das Access Token bleibt nur im Speicher und wird nicht persistent gespeichert. Vor dem Zugriff auf die Fachdaten wird über Google UserInfo geprüft, dass der für die APIs autorisierte Account dieselbe E-Mail-Adresse wie der angemeldete Account besitzt.

Der PoC fordert die Scopes `openid`, `email`, `profile`, `https://www.googleapis.com/auth/spreadsheets` und `https://www.googleapis.com/auth/drive` an. Für die festen Testkonten müssen Google Sheets API und Google Drive API im Google-Cloud-Projekt aktiviert und die Konten bei Bedarf als OAuth-Testnutzer hinterlegt sein.

An- und Abmeldung sind zentral im Header untergebracht. Im ausgeloggten Zustand rendert Google Identity Services dort den Google-Anmeldebutton. Im eingeloggten Zustand wird das Google-Profil als kompakter Konto-Button dargestellt. Die fachliche Rolle wird nach erfolgreichem Datenzugriff zusätzlich aus dem Sheet geladen.

## PoC-Vertrauensmodell

Für den Proof of Concept gibt es nur feste, bekannte und vertrauenswürdige Google-Konten. Diese Konten erhalten die notwendigen Freigaben für die verwendeten Google-Ressourcen und greifen direkt aus dem Browser-Client darauf zu. Es wird bewusst keine zusätzliche Backend- oder Autorisierungsschicht eingeführt.

Die fachlichen Rollen `Künstler` und `Kunde` bestimmen Oberfläche und erlaubte Abläufe in der Anwendung. Sie sind im PoC keine harte Sicherheitsgrenze gegenüber einem absichtlich manipulierten Client. Dieses vereinfachte Modell ist eine bewusste PoC-Entscheidung und muss vor einer Öffnung für nicht vertrauenswürdige Nutzer neu bewertet werden.

## Daten und Dateien

Die Google-Ressourcen sind fest für den PoC konfiguriert:

- Spreadsheet `Database`: `12F0kf0pVO-DcOIwoVbR49SgdJGr-DSZl0CdU-jVVwpI`
- Drive-Ordner `Images`: `1D2MBmtvGUYpc4i8Hg9ul0ki34ObBezmv`

`src/data/googleData.ts` kapselt die REST-Zugriffe auf Google Sheets und Drive. Das Sheet besteht aus drei Tabs:

- `Users`: `email`, `role`, `active`, `display_name`. Die E-Mail wird mit dem Google-Login abgeglichen; `role` ist `artist` oder `customer` und `active` muss TRUE sein.
- `Artworks`: Stammdaten eines Werks sowie die `image_file_id` aus Drive.
- `Reservations`: Anfrage- und Reservierungsverlauf mit `requested`, `active`, `cancelled` oder `returned`.

Die Galerie lädt alle drei kleinen PoC-Tabellen gemeinsam. Verfügbarkeit wird aus offenen Reservierungen abgeleitet. Abgeschlossene Reservierungen bleiben als Historie erhalten. Beim Löschen eines Werks werden offene oder aktive Reservierungen automatisch auf `cancelled` gesetzt, danach wird die Werkzeile gelöscht und die Bilddatei aus Drive entfernt.

Bilder werden per Drive-API in `Images` hochgeladen. Das Sheet speichert nur die Drive-Datei-ID. Für die Darstellung lädt der Browser die Bilddatei authentifiziert und erzeugt lokal eine temporäre Object-URL.

Die fachliche Oberfläche liegt in `src/gallery/Gallery.tsx`: Künstler können Werke anlegen, bearbeiten und löschen sowie Anfragen annehmen, ablehnen und Rückgaben bestätigen. Kunden können verfügbare Werke anfragen und eigene offene Anfragen zurückziehen.

Die fachlichen Abläufe und Zustandswechsel werden zusätzlich als Mermaid-Diagramme unter `docs/use-cases/` dokumentiert.

## Externe Google-Konfiguration

Für eine funktionsfähige Anmeldung muss außerhalb des Repositories ein Google Cloud OAuth Client vom Typ Webanwendung angelegt werden. Als autorisierte JavaScript-Ursprünge werden mindestens `https://weidmanngabriel.github.io` und für lokale Entwicklung `http://localhost:5173` benötigt. Die erzeugte Client-ID wird lokal als `VITE_GOOGLE_CLIENT_ID` und für GitHub Pages als Repository-Variable `GOOGLE_CLIENT_ID` gesetzt.

Zusätzlich müssen Google Sheets API und Google Drive API aktiviert sein. Die festen PoC-Konten benötigen Schreibzugriff auf `Database` und den Ordner `Images`. Solange der OAuth-Zustimmungsbildschirm im Testmodus läuft, müssen diese Konten dort als Testnutzer eingetragen sein.
