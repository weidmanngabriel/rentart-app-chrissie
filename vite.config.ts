import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/rentart-app-chrissie/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon.svg',
        'apple-touch-icon-v2.png',
        'pwa-192-v2.png',
        'pwa-512-v2.png',
      ],
      manifest: {
        name: 'RentArt',
        short_name: 'RentArt',
        description: 'Kunst, die bleibt.',
        lang: 'de',
        theme_color: '#f5f1e9',
        background_color: '#fbfaf7',
        display: 'standalone',
        icons: [
          { src: 'pwa-192-v2.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512-v2.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512-v2.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
