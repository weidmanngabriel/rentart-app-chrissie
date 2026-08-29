# Konzept

RentArt ist eine Plattform für lokale Kunst. Nutzer können Werke entdecken, für einen flexiblen Zeitraum mieten und später wechseln.

Die öffentliche Einstiegsseite erklärt RentArt. Die Galerie ist ein geschützter Bereich und wird erst nach Anmeldung mit einem Google-Konto angezeigt. Es gibt keine eigene Benutzerverwaltung und keine RentArt-Passwörter.

Die Google-Anmeldung ist jederzeit im Header erreichbar. Ohne Anmeldung zeigt der Header den Google-Anmeldebutton. Nach der Anmeldung erscheint dort das Google-Profil als Konto-Button. Das Kontomenü zeigt Name, E-Mail-Adresse und die fachliche Rolle des aktiven Kontos.

Mehrere Google-Konten können zu RentArt hinzugefügt und im Kontomenü direkt gewechselt werden, ohne das bisherige Konto vorher abzumelden. Die hinzugefügten Konten und der aktive Account bleiben auf dem Gerät gespeichert, sodass eine installierte PWA nach einem vollständigen Neustart weiterhin das zuletzt gewählte Konto kennt. Der aktive Account bestimmt vollständig die sichtbare Rolle, Galerie und erlaubten Aktionen. Beim Wechsel werden die fachlichen Daten für das gewählte Konto neu geladen. Ein einzelnes gespeichertes Konto kann über das Kontomenü wieder abgemeldet werden; andere hinzugefügte Konten bleiben dabei erhalten.

Nach einer erfolgreichen Google-Anmeldung benötigt RentArt zusätzlich den Google-API-Zugriff für Sheets und Drive. Dieser zweite Google-Schritt muss insbesondere auf iOS/Safari durch eine direkte Nutzeraktion gestartet werden, weil ein automatisch aus dem Login-Callback geöffnetes zweites Google-Fenster vom Browser blockiert werden kann. Deshalb springt RentArt nach dem Login direkt zum Freigabebereich. Dort ist der Button `Google-Daten freigeben` sofort sichtbar und öffnet die Google-Freigabe zuverlässig mit einem Klick.

Ein noch gültiger API-Zugriff wird zusammen mit seiner Ablaufzeit lokal auf dem Gerät gespeichert, sodass das Schließen und erneute Öffnen der installierten PWA die Datenfreigabe nicht sofort verliert. Ist das Token tatsächlich abgelaufen oder wurde es von Google ungültig gemacht, wird es entfernt und der Nutzer muss den Datenzugriff erneut aktivieren. Die bereits bei Google erteilte Zustimmung zu den Scopes bleibt davon getrennt bestehen.

Ohne Login bleiben Startseite, Erklärung von RentArt, Ablauf und Hintergrund öffentlich sichtbar. Im Galerie-Bereich wird nur ein Login-Hinweis angezeigt.

## Pull-to-Refresh in der installierten App

Die installierte PWA unterstützt auf Touch-Geräten ein eigenes Pull-to-Refresh. Befindet sich die Seite ganz oben, kann sie nach unten gezogen werden. Ein sichtbarer Hinweis zeigt an, wann weit genug gezogen wurde. Beim Loslassen wird die komplette Seite neu geladen, sodass aktuelle App-Dateien und aktuelle Daten aus Google Sheets/Drive geladen werden. Normales Scrollen innerhalb der Seite wird dadurch nicht verändert.

## Rollen im Proof of Concept

RentArt unterscheidet fachlich zwischen zwei Rollen:

- **Künstler (`artist`):** legt Werke an, bearbeitet oder löscht sie, lädt Bilder hoch, bearbeitet Reservierungsanfragen und bestätigt Rückgaben.
- **Mieter/Kunde (`customer`):** betrachtet die Galerie, erstellt Reservierungsanfragen und kann eigene noch offene Anfragen zurückziehen.

Die Rolle wird nicht im Code festgelegt, sondern im Google Sheet `Database` im Tab `Users`. Dort wird pro Account die Google-E-Mail-Adresse eingetragen. `role` muss `artist` oder `customer` sein und `active` muss TRUE sein. `display_name` ist optional. Ein angemeldeter Account ohne aktive gültige Zeile erhält keinen fachlichen Galerie-Zugriff.

Für den Proof of Concept gibt es nur feste, bekannte und vertrauenswürdige Google-Konten. Diese Konten dürfen direkt über den Client auf die freigegebenen Google-Ressourcen zugreifen. Die Rollen steuern die Oberfläche und die fachlichen Abläufe und sind keine zusätzliche harte Sicherheitsgrenze gegenüber einem absichtlich manipulierten Client.

## Galerie und Werkpflege

Die Galerie verwendet keine Demo-Werke mehr. Werke werden aus dem Tab `Artworks` geladen, Bilder aus dem Google-Drive-Ordner `Images`.

Ein Künstler sieht einen Künstlerbereich und kann:

- ein Werk mit Titel, Beschreibung, Monatspreis, Kategorie und Bild anlegen,
- Werkdaten und Bild bearbeiten,
- ein Werk löschen,
- offene Anfragen annehmen oder ablehnen,
- bei einer aktiven Reservierung die Rückgabe bestätigen.

Beim Löschen eines Werks wird die zugehörige Bilddatei ebenfalls entfernt. Existiert eine offene oder aktive Reservierung, wird sie vorher automatisch beendet. Deshalb kann auch ein reserviertes Werk direkt gelöscht werden.

Ein Mieter sieht keine Künstleraktionen. Für ein verfügbares Werk kann er eine Reservierungsanfrage erstellen. Eine eigene noch offene Anfrage kann er wieder zurückziehen. Bereits angefragte oder reservierte Werke werden als nicht verfügbar angezeigt.

## Reservierungsprinzip

Ein verfügbares Werk kann angefragt werden. Der Künstler kann die Anfrage annehmen oder ablehnen. Eine noch offene Anfrage kann vom Kunden zurückgezogen werden. Nach Annahme gilt das Werk als reserviert. Sobald der Künstler die Rückgabe bestätigt, ist das Werk wieder verfügbar.

Die Reservierungsstatus im Backend sind:

- `requested`: offene Anfrage,
- `active`: vom Künstler angenommen und reserviert,
- `cancelled`: vom Kunden zurückgezogen, vom Künstler abgelehnt oder beim Löschen des Werks beendet,
- `returned`: Rückgabe bestätigt.

Abgeschlossene Reservierungen bleiben als Historie im Sheet. Für die aktuelle Verfügbarkeit zählen nur `requested` und `active`.

Ein reserviertes Werk darf vom Künstler direkt gelöscht werden. Die Anwendung beendet dabei die aktive Reservierung automatisch und löscht anschließend das Werk; ein vorheriger manueller Wechsel auf `verfügbar` ist nicht nötig.

Die visuellen Abläufe sind unter [`docs/use-cases/`](docs/use-cases/README.md) dokumentiert.
