# Konzept

## Grundidee und Geschäftsmodell

RentArt ist eine Vermittlungsplattform, auf der Künstler ihre Kunstwerke zur Miete anbieten können. Dahinter steht die Annahme, dass die Vermietung eines Bildes einfacher sein kann, als einen Käufer zum vollen Kaufpreis zu finden. Interessierte Mieter können auf der Plattform passende Werke finden und die Künstler kontaktieren.

Die Plattform soll den gesamten Ablauf rund um die Vermietung unterstützen: Organisation, Kommunikation und finanzielle Abwicklung sowie die notwendige Absicherung, zum Beispiel durch Versicherung. Der aktuelle Proof of Concept bildet davon zunächst nur ausgewählte Kernfunktionen ab.

RentArt ist auf lokale Kunst ausgerichtet. Nutzer können Werke entdecken, anfragen, für einen flexiblen Zeitraum mieten und später zurückgeben oder wechseln.

## Landing Page und App-Bereich

RentArt besteht bewusst aus zwei klar getrennten Nutzererlebnissen:

- **Landing Page:** öffentlich und nur für nicht angemeldete Nutzer. Sie erklärt RentArt, den Nutzen und den grundlegenden Ablauf. Die eigentliche Galerie und persönliche Funktionen werden hier nicht angezeigt.
- **RentArt-App:** persönlicher Bereich nach erfolgreichem Google-Login. Hier befinden sich Galerie, Favoriten, eigene Kunstwerke bzw. Anfragen und Profil.

Nach erfolgreichem Google-Login wechselt die Anwendung direkt von der Landing Page in den App-Bereich. Ein bereits auf dem Gerät gespeichertes aktives Konto öffnet beim nächsten Start ebenfalls direkt die App. Wird das letzte aktive Konto abgemeldet, erscheint wieder die Landing Page.

Die öffentliche Dokumentenseite unter `#dokumente` bleibt als separate Projektansicht erreichbar und gehört weder zur Marketing-Landing-Page noch zur eigentlichen RentArt-Nutzer-App.

## Anmeldung und Google-Zugriff

Die Google-Anmeldung ist im Header erreichbar. Ohne Anmeldung zeigt der Header den Google-Anmeldebutton. Nach der Anmeldung erscheint dort das Google-Profil als Konto-Button. Das Kontomenü zeigt Name, E-Mail-Adresse und die fachliche Rolle des aktiven Kontos.

Mehrere Google-Konten können zu RentArt hinzugefügt und im Kontomenü direkt gewechselt werden. Die hinzugefügten Konten und der aktive Account bleiben auf dem Gerät gespeichert. Der aktive Account bestimmt die sichtbare Rolle, Galerie und erlaubten Aktionen.

Nach der Google-Anmeldung benötigt RentArt zusätzlich den Google-API-Zugriff für Sheets und Drive. Dieser zweite Schritt wird bewusst durch eine direkte Nutzeraktion im App-Bereich gestartet, weil iOS/Safari automatisch geöffnete Folgefenster blockieren kann.

Ein noch gültiger API-Zugriff wird zusammen mit seiner Ablaufzeit lokal auf dem Gerät gespeichert. Ist das Token abgelaufen oder ungültig, muss der Nutzer den Datenzugriff erneut aktivieren.

## Persönlicher Bereich und Navigation

Nach erfolgreichem Login, Google-Datenfreigabe und gültiger Rolle erhält der Nutzer eine dauerhaft sichtbare persönliche Navigation. Auf dem Handy ist sie fest am unteren Bildschirmrand verankert und bleibt beim Scrollen sichtbar.

Sie enthält vier Bereiche:

- **Entdecken:** Galerie mit vorhandenen Kategorien und Reservierungsaktionen,
- **Favoriten:** persönlich markierte Kunstwerke,
- **Meine Kunstwerke** für Künstler bzw. **Meine Anfragen** für Mieter,
- **Profil:** Name, E-Mail-Adresse und fachliche Rolle.

Beim Antippen eines Bereichs wird nur der gewählte App-Inhalt angezeigt. Marketingabschnitte der Landing Page werden für angemeldete Nutzer nicht mehr dargestellt.

Favoriten werden im Proof of Concept pro Google-Konto lokal auf dem jeweiligen Gerät gespeichert und noch nicht geräteübergreifend synchronisiert.

## Rollen im Proof of Concept

RentArt unterscheidet zwei fachliche Rollen:

- **Künstler (`artist`):** legt Werke an, bearbeitet oder löscht sie, lädt Bilder hoch, bearbeitet Reservierungsanfragen und bestätigt Rückgaben.
- **Mieter/Kunde (`customer`):** betrachtet die Galerie, setzt Favoriten, erstellt Reservierungsanfragen und kann eigene noch offene Anfragen zurückziehen.

Die Rolle wird im Google Sheet `Database` im Tab `Users` gepflegt. `role` muss `artist` oder `customer` sein und `active` muss TRUE sein. Ein angemeldeter Account ohne aktive gültige Zeile erhält keinen fachlichen App-Zugriff.

Für den Proof of Concept gibt es nur feste, bekannte und vertrauenswürdige Google-Konten. Die Rollen steuern die Oberfläche und die fachlichen Abläufe und sind keine zusätzliche harte Sicherheitsgrenze.

## Galerie und Werkpflege

Die Galerie verwendet keine Demo-Werke. Werke werden aus dem Tab `Artworks` geladen, Bilder aus dem Google-Drive-Ordner `Images`.

Ein Kunstwerk kann folgende Angaben enthalten:

- Titel,
- Beschreibung,
- Monatspreis,
- Kategorie,
- Bild,
- Maße,
- Technik bzw. Material,
- Entstehungsjahr,
- Standort.

Für bestehende Werke bleiben die zusätzlichen Angaben optional. Dadurch bleiben bereits vorhandene Datensätze kompatibel. Titel, Monatspreis und beim Neuanlegen ein Bild sind weiterhin die notwendigen Mindestangaben.

Ein Künstler kann Werke anlegen, bearbeiten und löschen sowie Anfragen annehmen, ablehnen und Rückgaben bestätigen. Beim Löschen eines Werks wird die zugehörige Bilddatei ebenfalls entfernt. Existiert eine offene oder aktive Reservierung, wird sie vorher automatisch beendet.

Ein Mieter sieht keine Künstleraktionen. Für ein verfügbares Werk kann er eine Reservierungsanfrage erstellen. Eine eigene noch offene Anfrage kann er wieder zurückziehen. Bereits angefragte oder reservierte Werke werden als nicht verfügbar angezeigt.

## Reservierungsprinzip

Ein verfügbares Werk kann angefragt werden. Der Künstler kann die Anfrage annehmen oder ablehnen. Eine noch offene Anfrage kann vom Kunden zurückgezogen werden. Nach Annahme gilt das Werk als reserviert. Sobald der Künstler die Rückgabe bestätigt, ist das Werk wieder verfügbar.

Die Reservierungsstatus im Backend sind:

- `requested`: offene Anfrage,
- `active`: vom Künstler angenommen und reserviert,
- `cancelled`: vom Kunden zurückgezogen, vom Künstler abgelehnt oder beim Löschen des Werks beendet,
- `returned`: Rückgabe bestätigt.

Abgeschlossene Reservierungen bleiben als Historie im Sheet. Für die aktuelle Verfügbarkeit zählen nur `requested` und `active`.

## Fachliche Dokumente in der App

Über `#dokumente` ist eine separate Unterseite erreichbar, auf der ausschließlich fachliche Projektdokumentation gelesen werden kann. Angezeigt werden `concept.md` sowie die Dokumente unter `docs/use-cases/`. Technische Arbeitsdokumente wie `architecture.md` und `agents.md` gehören nicht in diese Ansicht.

Markdown wird formatiert dargestellt; Mermaid-Blöcke werden als Diagramme gerendert. Die Dokumentenseite ist öffentlich erreichbar und benötigt weder Google-Login noch Google-Datenfreigabe.

## Pull-to-Refresh

Die installierte PWA unterstützt auf Touch-Geräten ein eigenes Pull-to-Refresh. Befindet sich die Seite ganz oben, kann sie nach unten gezogen werden. Beim Loslassen nach Überschreiten des Schwellwerts wird die Seite vollständig neu geladen, sodass aktuelle App-Dateien und Google-Daten geladen werden.
