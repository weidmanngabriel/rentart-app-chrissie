# Architektur

RentArt ist eine rein clientseitige React-Anwendung mit TypeScript und Vite. Der Einstieg liegt in `src/main.tsx`, die Oberfläche in `src/App.tsx`; globale Gestaltung liegt in `styles.css`.

`app.html` ist der Vite-Entwicklungseinstieg. GitHub Actions baut daraus statische Dateien und legt sie zusätzlich als `index.html` und Browser-Assets auf `main` ab. Dadurch funktioniert die bestehende GitHub-Pages-Einstellung „Deploy from branch“, ohne dass der Browser TypeScript-Quelldateien laden muss.

`vite-plugin-pwa` erzeugt Manifest und Service Worker. Die App benötigt kein Backend. Spätere persistente Daten werden direkt über Google Sheets gelesen und geschrieben, Dateien über Google Drive verwaltet. Google OAuth wird als Browser-Flow ergänzt; Client-ID und Ressourcen-IDs werden erst bei der externen Google-Konfiguration festgelegt. Private Secrets dürfen nicht im Client oder Repository liegen.
