# Architektur

RentArt ist eine rein clientseitige React-Anwendung mit TypeScript und Vite. Der Einstieg liegt in `src/main.tsx`, die Oberfläche in `src/App.tsx`; globale Gestaltung liegt in `styles.css`.

`app.html` ist der Vite-Entwicklungseinstieg. Der Build erzeugt daraus statische Dateien für GitHub Pages. Solange Pages aus dem Branch `main` veröffentlicht, werden `index.html` und die erzeugten Browser-Assets zusätzlich im Repository gehalten. Dadurch lädt der Browser keine TypeScript-Quelldateien.

`vite-plugin-pwa` erzeugt Manifest und Service Worker. Die App benötigt kein Backend. Spätere persistente Daten werden direkt über Google Sheets gelesen und geschrieben, Dateien über Google Drive verwaltet. Google OAuth wird als Browser-Flow ergänzt; Client-ID und Ressourcen-IDs werden erst bei der externen Google-Konfiguration festgelegt. Private Secrets dürfen nicht im Client oder Repository liegen.
