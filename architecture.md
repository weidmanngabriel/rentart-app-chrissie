# Architektur

RentArt ist als kleine, clientseitige React-Anwendung mit TypeScript und Vite aufgebaut. Die Oberfläche liegt in `src/App.tsx`, globale Gestaltung in `src/styles.css`. Der aktuelle Stand enthält bewusst nur UI-Grundlagen und lokale Demo-Daten.

Die PWA-Funktion wird über `vite-plugin-pwa` erzeugt. GitHub Actions baut den Vite-Output bei jedem Push auf `main` und veröffentlicht ihn über GitHub Pages.

Für spätere Produktfunktionen bleiben Google Sheets und Google Drive die externen Speicher. Google-Anmeldung sowie API-Zugriff werden erst ergänzt, wenn die erste Fachfunktion definiert ist. Es werden keine Secrets im Frontend gespeichert.
