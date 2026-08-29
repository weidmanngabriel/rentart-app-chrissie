# Architektur

RentArt ist eine rein clientseitige React-Anwendung mit TypeScript und Vite. Der Einstieg liegt in `src/main.tsx`, die Oberfläche in `src/App.tsx`; globale Gestaltung liegt in `styles.css`, ergänzende Styles für die Google-Anmeldung in `src/auth.css` und für die datenbasierte Galerie in `src/gallery.css`.

`index.html` ist der einzige Vite-Einstieg für Entwicklung und Produktionsbuild. Vite erzeugt daraus ausschließlich im Verzeichnis `dist` die statischen Dateien für GitHub Pages. Die GitHub-Action baut und veröffentlicht `dist` bei Änderungen auf `main`; erzeugte Dateien gehören nicht ins Repository.

`vite-plugin-pwa` erzeugt Manifest und Service Worker bei jedem Produktionsbuild. Die App benötigt kein eigenes Backend.

`src/PullToRefresh.tsx` umschließt die Anwendung direkt in `src/main.tsx` und ergänzt für Touch-Geräte ein eigenes Pull-to-Refresh. Die Geste wird nur gestartet, wenn `window.scrollY === 0`. Vertikales Herunterziehen wird gedämpft visualisiert; horizontale Gesten und normales Scrollen werden nicht übernommen. Nach Überschreiten des Schwellwerts löst das Loslassen einen vollständigen `window.location.reload()` aus. Dadurch werden sowohl der aktuelle PWA-Stand als auch anschließend die Google-Daten neu geladen. Login-Profile bleiben dabei durch die bestehende lokale Persistenz erhalten.

## Deployment

GitHub Pages verwendet **GitHub Actions** als Veröffentlichungsquelle. Der Workflow installiert die Abhängigkeiten, führt `npm run build` aus und veröffentlicht anschließend nur das erzeugte `dist`-Artefakt. Generierte Build- und PWA-Dateien werden nicht versioniert. Nach jeder Änderung auf `main` muss der Workflow erfolgreich abgeschlossen sein.

## Anmeldung und Google-Autorisierung

Die Anmeldung verwendet Google Identity Services im Browser. Der öffentliche OAuth-Web-Client wird über `VITE_GOOGLE_CLIENT_ID` konfiguriert. Für den GitHub-Pages-Build liest die Action den Wert aus der Repository-Variable `GOOGLE_CLIENT_ID`. Die Client-ID ist kein Secret; ein Client-Secret darf nicht im Frontend oder Repository liegen.

Die Verarbeitung der Google-ID-Credentials liegt in `src/auth/google.ts`. Mehrere bekannte Google-Konten sowie die E-Mail-Adresse des aktuell aktiven Accounts werden dauerhaft in `localStorage` gespeichert, damit eine installierte PWA insbesondere unter iOS nach einem vollständigen Neustart nicht wieder als ausgeloggt erscheint. Gespeichert werden nur die bereits aus einem gültigen Google-ID-Credential gelesenen Profildaten, nicht das Credential selbst. Frühere Login-Daten aus `sessionStorage` werden beim ersten Start automatisch übernommen und anschließend aus dem Session-Speicher entfernt.

Der aktive Google-Account wird im Header gewählt. Ein Wechsel ändert nur den aktiven Account und löscht die anderen gespeicherten Konten nicht. `src/App.tsx` setzt beim Wechsel das aktuell geladene Backend-Snapshot zurück und lädt Rolle, Galerie und Reservierungen für den neuen Account neu.

Anmeldung und API-Zugriff sind getrennt: `src/auth/googleAccess.ts` verwendet `google.accounts.oauth2.initTokenClient`, um kurzlebige Access Tokens für Google Sheets und Google Drive anzufordern. Vor dem Zugriff auf die Fachdaten wird über Google UserInfo geprüft, dass der für die APIs autorisierte Account dieselbe E-Mail-Adresse wie der aktive Login besitzt.

Die kurzlebigen Access Tokens werden weiterhin ausschließlich in `sessionStorage` gespeichert, getrennt nach Google-E-Mail-Adresse. Dadurch kann beim Wechsel zu einem bereits autorisierten Account dessen noch gültiger Token innerhalb derselben Browser-/PWA-Sitzung wiederverwendet werden. Nach einem vollständigen Neustart kann für den Datenzugriff erneut ein kurzlebiges Token nötig sein; die eigentliche RentArt-Kontoauswahl bleibt davon unberührt. Ein abgelaufener oder ungültiger Token wird nur für das betroffene Konto entfernt. Das Abmelden eines einzelnen Kontos entfernt dessen gespeichertes Profil und API-Token, lässt andere gespeicherte Konten aber bestehen.

Der PoC fordert die Scopes `openid`, `email`, `profile`, `https://www.googleapis.com/auth/spreadsheets` und `https://www.googleapis.com/auth/drive` an. Für die festen Testkonten müssen Google Sheets API und Google Drive API im Google-Cloud-Projekt aktiviert und die Konten bei Bedarf als OAuth-Testnutzer hinterlegt sein.

An- und Abmeldung sind zentral im Header untergebracht. Im ausgeloggten Zustand rendert Google Identity Services dort den Google-Anmeldebutton. Im eingeloggten Zustand wird das aktive Google-Profil als kompakter Konto-Button dargestellt. Das Kontomenü enthält alle gespeicherten Accounts, einen direkten Accountwechsel, einen Google-Button zum Hinzufügen weiterer Konten und die Abmeldung des aktiven Kontos. Die fachliche Rolle des aktiven Kontos wird nach erfolgreichem Datenzugriff zusätzlich aus dem Sheet geladen.

## PoC-Vertrauensmodell

Für den Proof of Concept gibt es nur feste, bekannte und vertrauenswürdige Google-Konten. Diese Konten erhalten die notwendigen Freigaben für die verwendeten Google-Ressourcen und greifen direkt aus dem Browser-Client darauf zu. Es wird bewusst keine zusätzliche Backend- oder Autorisierungsschicht eingeführt.

Die fachlichen Rollen `Künstler` und `Kunde` bestimmen Oberfläche und erlaubte Abläufe in der Anwendung. Sie sind im PoC keine harte Sicherheitsgrenze gegenüber einem absichtlich manipulierten Client. Dieses vereinfachte Modell ist eine bewusste PoC-Entscheidung und muss vor einer Öffnung für nicht vertrauenswürdige Nutzer neu bewertet werden.

## Daten und Dateien

Die Google-Ressourcen sind fest für den PoC konfiguriert:

- Spreadsheet `Database`: `12F0kf0pVO-DcOIwoVbR49SgdJGr-DSZl0CdU-jVVwpI`
- Drive-Ordner `Images`: `1D2MBmtvGUYpc4i8Hg9ul0ki34ObBezmv`

`src/data/googleData.ts` kapselt die REST-Zugriffe auf Google Sheets und Drive. Das Sheet besteht aus drei Tabs:

- `Users`: `email`, `role`, `active`, `display_name`. Die E-Mail wird mit dem aktiven Google-Login abgeglichen; `role` ist `artist` oder `customer` und `active` muss TRUE sein.
- `Artworks`: Stammdaten eines Werks sowie die `image_file_id` aus Drive.
- `Reservations`: Anfrage- und Reservierungsverlauf mit `requested`, `active`, `cancelled` oder `returned`.

Die Galerie lädt alle drei kleinen PoC-Tabellen gemeinsam. Verfügbarkeit wird aus offenen Reservierungen abgeleitet. Abgeschlossene Reservierungen bleiben als Historie erhalten. Beim Löschen eines Werks werden offene oder aktive Reservierungen automatisch auf `cancelled` gesetzt, danach wird die Werkzeile gelöscht und die Bilddatei aus Drive entfernt.

Für leere Checkbox-Spalten im Sheet dürfen keine vorbefüllten `FALSE`-Werte über den gesamten Datenbereich stehen. Solche Werte würden Google Sheets beim `append` als belegte Zeilen behandeln und neue Datensätze ans Tabellenende verschieben. Die vorbereiteten Zeilen enthalten deshalb nur Datenvalidierung, aber keinen Zellwert.

Bilder werden per Drive-API in `Images` hochgeladen. Das Sheet speichert nur die Drive-Datei-ID. Für die Darstellung lädt der Browser die Bilddatei authentifiziert und erzeugt lokal eine temporäre Object-URL.

Die fachliche Oberfläche liegt in `src/gallery/Gallery.tsx`: Künstler können Werke anlegen, bearbeiten und löschen sowie Anfragen annehmen, ablehnen und Rückgaben bestätigen. Kunden können verfügbare Werke anfragen und eigene offene Anfragen zurückziehen.

Die fachlichen Abläufe und Zustandswechsel werden zusätzlich als Mermaid-Diagramme unter `docs/use-cases/` dokumentiert.

## Externe Google-Konfiguration

Für eine funktionsfähige Anmeldung muss außerhalb des Repositories ein Google Cloud OAuth Client vom Typ Webanwendung angelegt werden. Als autorisierte JavaScript-Ursprünge werden mindestens `https://weidmanngabriel.github.io` und für lokale Entwicklung `http://localhost:5173` benötigt. Die erzeugte Client-ID wird lokal als `VITE_GOOGLE_CLIENT_ID` und für GitHub Pages als Repository-Variable `GOOGLE_CLIENT_ID` gesetzt.

Zusätzlich müssen Google Sheets API und Google Drive API aktiviert sein. Die festen PoC-Konten benötigen Schreibzugriff auf `Database` und den Ordner `Images`. Solange der OAuth-Zustimmungsbildschirm im Testmodus läuft, müssen diese Konten dort als Testnutzer eingetragen sein.
