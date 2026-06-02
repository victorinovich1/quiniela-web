'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          await navigator.serviceWorker.register('/sw.js')
          await navigator.serviceWorker.ready
        } catch (error) {
          console.error('[SW] Error en registro:', error)
        }
      })
    }
  }, [])

  return null
}
