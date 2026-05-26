'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log('[SW] Registrado exitosamente:', registration.scope)
          
          // Esperar a que esté activo
          if (registration.active) {
            console.log('[SW] Service Worker activo')
          } else {
            console.log('[SW] Esperando activación...')
            await navigator.serviceWorker.ready
            console.log('[SW] Service Worker ready')
          }
        } catch (error) {
          console.error('[SW] Error en registro:', error)
        }
      })
    } else {
      console.warn('[SW] Service Workers no soportados en este navegador')
    }
  }, [])

  return null
}
