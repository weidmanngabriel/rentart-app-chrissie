# Konzept

RentArt ist eine Plattform für lokale Kunst. Nutzer können Werke entdecken, für einen flexiblen Zeitraum mieten und später wechseln.

Die öffentliche Einstiegsseite erklärt RentArt. Die Galerie ist ein geschützter Bereich und wird erst nach Anmeldung mit einem Google-Konto angezeigt. Es gibt keine eigene Benutzerverwaltung und keine RentArt-Passwörter.

Die Google-Anmeldung ist jederzeit im Header erreichbar. Ohne Anmeldung zeigt der Header den Google-Anmeldebutton. Nach der Anmeldung erscheint dort das Google-Profil als Konto-Button; ein Klick darauf öffnet ein kleines Kontomenü mit Name, E-Mail-Adresse und einer klar sichtbaren Abmeldeaktion. Der Galerie-Bereich selbst enthält keine zusätzliche An- oder Abmeldung.

Ohne Login bleiben Startseite, Erklärung von RentArt, Ablauf und Hintergrund öffentlich sichtbar. Im Galerie-Bereich wird nur ein Login-Hinweis angezeigt. Erst nach erfolgreichem Login werden Galerieüberschrift, Filter und Kunstwerke eingeblendet.

Die aktuell dargestellten Werke und Preise sind noch Demo-Inhalte. Im nächsten Schritt werden Galeriedaten aus Google Sheets gelesen und Bilder aus Google Drive geladen. Die tatsächlichen Zugriffsrechte auf diese Ressourcen werden über Google-Freigaben geregelt.

## Rollen im Proof of Concept

RentArt unterscheidet fachlich zwischen zwei Rollen:

- **Künstler:** legt Werke an, bearbeitet oder löscht sie, lädt Bilder hoch, bearbeitet Reservierungsanfragen und bestätigt Rückgaben.
- **Kunde:** betrachtet die Galerie, erstellt Reservierungsanfragen und kann eigene noch offene Anfragen zurückziehen.

Für den Proof of Concept gibt es nur feste, bekannte und vertrauenswürdige Google-Konten. Diese Konten dürfen direkt über den Client auf die freigegebenen Google-Ressourcen zugreifen. Die Rollen steuern zunächst die Oberfläche und die fachlichen Abläufe und sind keine zusätzliche harte Sicherheitsgrenze gegenüber einem absichtlich manipulierten Client.

## Reservierungsprinzip

Ein verfügbares Werk kann angefragt werden. Der Künstler kann die Anfrage annehmen oder ablehnen. Eine noch offene Anfrage kann vom Kunden zurückgezogen werden. Nach Annahme gilt das Werk als reserviert. Sobald der Künstler die Rückgabe bestätigt, ist das Werk wieder verfügbar.

Die visuellen Abläufe sind unter [`docs/use-cases/`](docs/use-cases/README.md) dokumentiert.
