import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quiniela Mundial 2026',
    short_name: 'Quiniela2026',
    description: 'Pronostica los partidos del Mundial 2026 y compite con tus amigos',
    start_url: '/',
    display: 'standalone',
    background_color: '#04061a',
    theme_color: '#04061a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
