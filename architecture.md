# Architektur

RentArt ist eine rein clientseitige React-Anwendung mit TypeScript und Vite. Der Einstieg liegt in `src/main.tsx`, die Oberfläche in `src/App.tsx`; globale Gestaltung liegt in `styles.css`, ergänzende Styles für die Google-Anmeldung in `src/auth.css`, für die datenbasierte Galerie in `src/gallery.css` und für die Projektdokumente in `src/docs.css`.

`index.html` ist der einzige Vite-Einstieg für Entwicklung und Produktionsbuild. Vite erzeugt daraus ausschließlich im Verzeichnis `dist` die statischen Dateien für GitHub Pages. Die GitHub-Action baut und veröffentlicht `dist` bei Änderungen auf `main`; erzeugte Dateien gehören nicht ins Repository.

`vite-plugin-pwa` erzeugt Manifest und Service Worker bei jedem Produktionsbuild. Die App benötigt kein eigenes Backend. Für installierte Apps werden versionierte PNG-Icons in 192×192 und 512×512 Pixeln im Manifest verwendet. `index.html` verweist zusätzlich explizit auf ein 180×180 `apple-touch-icon`, damit iOS beim Hinzufügen zum Home-Bildschirm nicht auf ein generisches Ersatzsymbol zurückfällt. Neue Icon-Dateinamen dürfen bei Icon-Änderungen bewusst verwendet werden, um besonders hartnäckige Home-Screen-Caches von iOS zu umgehen.

`src/PullToRefresh.tsx` umschließt die Anwendung direkt in `src/main.tsx` und ergänzt für Touch-Geräte ein eigenes Pull-to-Refresh. Die Geste wird nur gestartet, wenn `window.scrollY === 0`. Vertikales Herunterziehen wird gedämpft visualisiert; horizontale Gesten und normales Scrollen werden nicht übernommen. Nach Überschreiten des Schwellwerts löst das Loslassen einen vollständigen `window.location.reload()` aus. Dadurch werden sowohl der aktuelle PWA-Stand als auch anschließend die Google-Daten neu geladen. Login-Profile und noch gültige Google-API-Tokens bleiben dabei durch die lokale Persistenz erhalten.

## Navigation und Projektdokumente

`src/App.tsx` unterscheidet über den URL-Hash zwischen der normalen Startansicht und der Unterseite `#dokumente`. Damit bleibt die Anwendung ohne zusätzliche Routing-Library klein und funktioniert weiterhin vollständig als statische GitHub-Pages-App. Die normale Navigation kann aus der Dokumentenansicht zurück zu Galerie, Ablauf und Story wechseln.

Innerhalb des geschützten fachlichen Bereichs übernimmt `src/gallery/Gallery.tsx` eine zweite, bewusst kleine Navigation ohne zusätzliche Routing-Library. Der Zustand bleibt lokal in React und wechselt zwischen `Kunstwerke`, `Favoriten`, dem rollenabhängigen Bereich `Meine Kunstwerke` bzw. `Meine Anfragen` und `Mein Profil`. Dadurch müssen die vorhandenen Google-Daten nicht mehrfach geladen werden; alle Bereiche verwenden denselben bereits geladenen `DatabaseSnapshot`.

Favoriten sind im PoC bewusst kein neuer Sheets-Tab. Die Artwork-IDs werden pro Google-E-Mail-Adresse unter einem eigenen `localStorage`-Schlüssel gespeichert. Das hält die Funktion klein und schnell testbar, bedeutet aber auch, dass Favoriten nicht geräteübergreifend synchronisiert werden.

`src/docs/DocsPage.tsx` bündelt ausschließlich fachliche Markdown-Dateien mit Vites `?raw`-Importen direkt in den Produktionsbuild. Angezeigt werden `concept.md` und die derzeit vorhandenen Dateien unter `docs/use-cases/`; interne Arbeits- und Technikdokumente wie `agents.md` und `architecture.md` werden nicht in der App angeboten. Die Dokumentenansicht benötigt zur Laufzeit weder GitHub- noch Google-Zugriff und zeigt den Stand des jeweiligen Builds.

`src/docs/MarkdownDocument.tsx` rendert die benötigten Markdown-Strukturen direkt als React-Elemente. Unterstützt werden Überschriften, Absätze, nummerierte und unnummerierte Listen, Hervorhebungen, Inline-Code, Links und Codeblöcke. Relative Links zwischen den fachlichen Markdown-Dateien werden innerhalb der Dokumentenansicht auf das passende Dokument umgeleitet.

Mermaid-Codeblöcke werden als echte Diagramme gerendert. Dafür lädt die Dokumentenansicht bei Bedarf die fest gepinnte Mermaid-Version `11.17.2` aus dem jsDelivr-CDN und verwendet `securityLevel: strict`. Normale Codeblöcke bleiben unverändert als Code sichtbar. Falls Mermaid nicht geladen oder ein Diagramm nicht geparst werden kann, zeigt die App den Quelltext als Fallback statt einer leeren Fläche.

## Deployment

GitHub Pages verwendet **GitHub Actions** als Veröffentlichungsquelle. Der Workflow installiert die Abhängigkeiten, führt `npm run build` aus und veröffentlicht anschließend nur das erzeugte `dist`-Artefakt. Generierte Build- und PWA-Dateien werden nicht versioniert. Nach jeder Änderung auf `main` muss der Workflow erfolgreich abgeschlossen sein.

## Anmeldung und Google-Autorisierung

Die Anmeldung verwendet Google Identity Services im Browser. Der öffentliche OAuth-Web-Client wird über `VITE_GOOGLE_CLIENT_ID` konfiguriert. Für den GitHub-Pages-Build liest die Action den Wert aus der Repository-Variable `GOOGLE_CLIENT_ID`. Die Client-ID ist kein Secret; ein Client-Secret darf nicht im Frontend oder Repository liegen.

Die Verarbeitung der Google-ID-Credentials liegt in `src/auth/google.ts`. Mehrere bekannte Google-Konten sowie die E-Mail-Adresse des aktuell aktiven Accounts werden dauerhaft in `localStorage` gespeichert, damit eine installierte PWA insbesondere unter iOS nach einem vollständigen Neustart nicht wieder als ausgeloggt erscheint. Gespeichert werden nur die bereits aus einem gültigen Google-ID-Credential gelesenen Profildaten, nicht das Credential selbst. Frühere Login-Daten aus `sessionStorage` werden beim ersten Start automatisch übernommen und anschließend aus dem Session-Speicher entfernt.

Der aktive Google-Account wird im Header gewählt. Ein Wechsel ändert nur den aktiven Account und löscht die anderen gespeicherten Konten nicht. `src/App.tsx` setzt beim Wechsel das aktuell geladene Backend-Snapshot zurück und lädt Rolle, Galerie und Reservierungen für den neuen Account neu.

Anmeldung und API-Zugriff sind getrennt: `src/auth/googleAccess.ts` verwendet `google.accounts.oauth2.initTokenClient`, um kurzlebige Access Tokens für Google Sheets und Google Drive anzufordern. Dieser zweite Google-Schritt wird nicht automatisch aus dem Login-Callback geöffnet, weil iOS/Safari ein solches Folgefenster als nicht direkt nutzerinitiierte Aktion blockieren kann. Nach erfolgreichem Login scrollt `src/App.tsx` deshalb direkt zum Freigabebereich. Der dortige Button startet die API-Autorisierung als echte Nutzeraktion und ist damit auf mobilen Browsern zuverlässiger. Vor dem Zugriff auf die Fachdaten wird über Google UserInfo geprüft, dass der für die APIs autorisierte Account dieselbe E-Mail-Adresse wie der aktive Login besitzt.

Die kurzlebigen Access Tokens werden nach E-Mail-Adresse getrennt zusammen mit ihrer Ablaufzeit in `localStorage` gespeichert. Dadurch überlebt ein noch gültiger Datenzugriff einen vollständigen Browser- oder PWA-Neustart auf dem Gerät. Beim Lesen wird die Ablaufzeit geprüft; abgelaufene Tokens werden sofort entfernt. Ein von Google mit HTTP 401 abgelehnter Token wird ebenfalls nur für das betroffene Konto gelöscht. Da Google Identity Services im reinen Browser-Tokenmodell für das Anfordern eines neuen Tokens eine Nutzeraktion verlangt, kann nach tatsächlichem Ablauf weiterhin ein erneuter Klick auf die Datenfreigabe nötig sein. Frühere Tokens aus `sessionStorage` werden einmalig übernommen. Das Abmelden eines einzelnen Kontos entfernt dessen gespeichertes Profil und API-Token, lässt andere gespeicherte Konten aber bestehen.

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

Die fachliche Oberfläche liegt in `src/gallery/Gallery.tsx`: Künstler können Werke anlegen, bearbeiten und löschen sowie Anfragen annehmen, ablehnen und Rückgaben bestätigen. Kunden können verfügbare Werke anfragen und eigene offene Anfragen zurückziehen. Dieselbe Komponente trennt diese Funktionen inzwischen in eigene sichtbare Bereiche und zeigt die gespeicherten Favoriten sowie das einfache Profil an.

Die fachlichen Abläufe und Zustandswechsel werden zusätzlich als Mermaid-Diagramme unter `docs/use-cases/` dokumentiert.

## Externe Google-Konfiguration

Für eine funktionsfähige Anmeldung muss außerhalb des Repositories ein Google Cloud OAuth Client vom Typ Webanwendung angelegt werden. Als autorisierte JavaScript-Ursprünge werden mindestens `https://weidmanngabriel.github.io` und für lokale Entwicklung `http://localhost:5173` benötigt. Die erzeugte Client-ID wird lokal als `VITE_GOOGLE_CLIENT_ID` und für GitHub Pages als Repository-Variable `GOOGLE_CLIENT_ID` gesetzt.

Zusätzlich müssen Google Sheets API und Google Drive API aktiviert sein. Die festen PoC-Konten benötigen Schreibzugriff auf `Database` und den Ordner `Images`. Solange der OAuth-Zustimmungsbildschirm im Testmodus läuft, müssen diese Konten dort als Testnutzer eingetragen sein.
