# Architektur

RentArt ist eine rein clientseitige React-Anwendung mit TypeScript und Vite. Der Einstieg liegt in `src/main.tsx`, die Oberfläche in `src/App.tsx`; globale Gestaltung liegt in `styles.css`, ergänzende Styles für die Google-Anmeldung in `src/auth.css`, für die datenbasierte Galerie in `src/gallery.css` und für die Projektdokumente in `src/docs.css`.

`index.html` ist der einzige Vite-Einstieg. Vite erzeugt ausschließlich im Verzeichnis `dist` die statischen Dateien für GitHub Pages. Die GitHub-Action baut und veröffentlicht `dist` bei Änderungen auf `main`; erzeugte Dateien gehören nicht ins Repository.

`vite-plugin-pwa` erzeugt Manifest und Service Worker bei jedem Produktionsbuild. Die App benötigt kein eigenes Backend. Für installierte Apps werden versionierte PNG-Icons verwendet; `index.html` verweist zusätzlich auf ein `apple-touch-icon`.

`src/PullToRefresh.tsx` umschließt die Anwendung und ergänzt für Touch-Geräte ein eigenes Pull-to-Refresh. Nach Überschreiten des Schwellwerts löst das Loslassen einen vollständigen `window.location.reload()` aus. Gespeicherte Login-Profile und noch gültige Google-API-Tokens bleiben dabei erhalten.

## Landing Page und App-Modus

`src/App.tsx` trennt die Oberfläche abhängig vom Anmeldestatus in zwei Modi:

- **nicht angemeldet:** öffentliche Landing Page mit Erklärung, Ablauf, Story und Google-Login,
- **angemeldet:** eigener RentArt-App-Bereich mit Galerie und persönlichen Funktionen; Marketingabschnitte der Landing Page werden nicht mehr gerendert.

Ein erfolgreicher Google-Login setzt die Anwendung auf die normale App-Ansicht zurück und zeigt anschließend den Datenfreigabeschritt oder direkt die geladenen Fachdaten. Wird das letzte aktive Konto abgemeldet, fällt die Anwendung wieder auf die Landing Page zurück.

Die persönliche Bereichsnavigation liegt auf App-Ebene in `src/App.tsx` und bleibt nach erfolgreichem Login, Datenfreigabe und gültiger Rolle dauerhaft sichtbar. Sie wechselt zwischen `Entdecken`, `Favoriten`, dem rollenabhängigen Bereich `Meine Kunstwerke` bzw. `Meine Anfragen` und `Profil`. Auf kleinen Bildschirmen liegt sie fest am unteren Bildschirmrand.

`src/gallery/Gallery.tsx` rendert nur den aktuell gewählten App-Bereich. Dadurch müssen die Google-Daten beim Wechsel zwischen Bereichen nicht erneut geladen werden.

## Projektdokumente

`src/App.tsx` unterscheidet über den URL-Hash zusätzlich die normale Anwendung und die separate Unterseite `#dokumente`. Diese Dokumentenansicht bleibt öffentlich erreichbar und ist nicht Teil des eigentlichen Nutzer-App-Flows.

`src/docs/DocsPage.tsx` bündelt fachliche Markdown-Dateien mit Vites `?raw`-Importen direkt in den Produktionsbuild. Angezeigt werden `concept.md` und die vorhandenen Dateien unter `docs/use-cases/`; `agents.md` und `architecture.md` werden nicht öffentlich angeboten.

`src/docs/MarkdownDocument.tsx` rendert Markdown als React-Elemente. Mermaid-Codeblöcke werden mit der fest gepinnten Mermaid-Version `11.17.2` aus dem jsDelivr-CDN gerendert; bei Fehlern bleibt der Quelltext sichtbar.

## Anmeldung und Google-Autorisierung

Die Anmeldung verwendet Google Identity Services im Browser. Der öffentliche OAuth-Web-Client wird über `VITE_GOOGLE_CLIENT_ID` konfiguriert. Für den GitHub-Pages-Build liest die Action den Wert aus der Repository-Variable `GOOGLE_CLIENT_ID`.

Die Verarbeitung der Google-ID-Credentials liegt in `src/auth/google.ts`. Mehrere bekannte Google-Konten sowie die E-Mail-Adresse des aktuell aktiven Accounts werden dauerhaft in `localStorage` gespeichert. Gespeichert werden Profildaten, nicht das ID-Credential selbst.

Der aktive Google-Account wird im Header gewählt. Ein Wechsel setzt den geladenen Backend-Snapshot zurück und lädt Rolle, Galerie und Reservierungen für den neuen Account neu.

Anmeldung und API-Zugriff sind getrennt: `src/auth/googleAccess.ts` verwendet `google.accounts.oauth2.initTokenClient`, um kurzlebige Access Tokens für Google Sheets und Google Drive anzufordern. Der zweite Google-Schritt wird im App-Bereich durch eine direkte Nutzeraktion gestartet, damit er insbesondere auf iOS/Safari nicht als Popup blockiert wird.

Die Access Tokens werden pro E-Mail-Adresse zusammen mit ihrer Ablaufzeit in `localStorage` gespeichert. Vor dem Datenzugriff wird geprüft, dass Login und API-Autorisierung dieselbe Google-E-Mail-Adresse verwenden. Ein HTTP-401 entfernt nur den betroffenen Token.

Der PoC fordert die Scopes `openid`, `email`, `profile`, `https://www.googleapis.com/auth/spreadsheets` und `https://www.googleapis.com/auth/drive` an.

## PoC-Vertrauensmodell

Für den Proof of Concept gibt es nur feste, bekannte und vertrauenswürdige Google-Konten. Diese Konten erhalten die notwendigen Freigaben für die verwendeten Google-Ressourcen und greifen direkt aus dem Browser-Client darauf zu. Die Rollen `artist` und `customer` steuern Oberfläche und Abläufe, sind aber keine harte Sicherheitsgrenze gegenüber einem manipulierten Client.

## Daten und Dateien

Die Google-Ressourcen sind fest für den PoC konfiguriert:

- Spreadsheet `Database`: `12F0kf0pVO-DcOIwoVbR49SgdJGr-DSZl0CdU-jVVwpI`
- Drive-Ordner `Images`: `1D2MBmtvGUYpc4i8Hg9ul0ki34ObBezmv`

`src/data/googleData.ts` kapselt die REST-Zugriffe auf Google Sheets und Drive. Das Sheet besteht aus drei Tabs:

- `Users`: `email`, `role`, `active`, `display_name`,
- `Artworks`: Werkdaten und `image_file_id`,
- `Reservations`: Anfrage- und Reservierungsverlauf.

Der Tab `Artworks` wird nun bis Spalte N gelesen und geschrieben. Die Spalten sind positionsbasiert:

- A `id`
- B `title`
- C `description`
- D `artist_email`
- E `price_monthly`
- F `category`
- G `image_file_id`
- H `active`
- I `created_at`
- J `updated_at`
- K `dimensions`
- L `material`
- M `year`
- N `location`

Die zusätzlichen Felder K bis N sind optional. Bestehende Datensätze mit nur A bis J bleiben gültig und werden beim Laden mit leeren Werten ergänzt.

Bilder werden per Drive-API in `Images` hochgeladen. Das Sheet speichert nur die Drive-Datei-ID. Für die Darstellung lädt der Browser die Bilddatei authentifiziert und erzeugt lokal eine temporäre Object-URL.

Die Galerie lädt alle drei kleinen PoC-Tabellen gemeinsam. Verfügbarkeit wird aus offenen Reservierungen abgeleitet. Beim Löschen eines Werks werden offene oder aktive Reservierungen automatisch auf `cancelled` gesetzt, danach wird die Werkzeile gelöscht und die Bilddatei aus Drive entfernt.

Favoriten sind weiterhin kein eigener Sheets-Tab. Die Artwork-IDs werden pro Google-E-Mail-Adresse in `localStorage` gespeichert.

## Deployment

GitHub Pages verwendet GitHub Actions als Veröffentlichungsquelle. Der Workflow installiert die Abhängigkeiten, führt `npm run build` aus und veröffentlicht nur das erzeugte `dist`-Artefakt. Nach jeder Änderung auf `main` muss der Workflow erfolgreich abgeschlossen sein.

## Externe Google-Konfiguration

Für eine funktionsfähige Anmeldung muss außerhalb des Repositories ein Google Cloud OAuth Client vom Typ Webanwendung angelegt sein. Als autorisierte JavaScript-Ursprünge werden mindestens `https://weidmanngabriel.github.io` und für lokale Entwicklung `http://localhost:5173` benötigt.

Zusätzlich müssen Google Sheets API und Google Drive API aktiviert sein. Die festen PoC-Konten benötigen Schreibzugriff auf `Database` und den Ordner `Images`. Solange der OAuth-Zustimmungsbildschirm im Testmodus läuft, müssen diese Konten als Testnutzer eingetragen sein.
