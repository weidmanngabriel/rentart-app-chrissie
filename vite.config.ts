import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/rentart-app-chrissie/',
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'app.html')
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'RentArt',
        short_name: 'RentArt',
        description: 'Kunst, die bleibt.',
        theme_color: '#f5f1e9',
        background_color: '#fbfaf7',
        display: 'standalone',
        icons: [
          { src: '/rentart-app-chrissie/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
