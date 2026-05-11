'use client'

import { useEffect, useState } from 'react'

/**
 * Muestra timestamp actual en zona horaria local del usuario
 * Se actualiza cada minuto para mantener la hora fresca
 */
export default function LiveTimestamp() {
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setTimestamp(
        new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    }

    // Generar timestamp inicial
    updateTime()

    // Actualizar cada minuto
    const interval = setInterval(updateTime, 60000)

    return () => clearInterval(interval)
  }, [])

  if (!timestamp) return <span className="text-white/40">Cargando...</span>

  return <span>Actualizado: {timestamp}</span>
}
