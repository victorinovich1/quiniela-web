// Configuración de avatares del sistema
// Actualiza estos valores cuando agregues más imágenes

export const TOTAL_AVATARS = 30 // Total de avatares en /permanentes/

export const AVATAR_PATHS = {
  permanent: (id: number) => `/images/avatars/permanentes/${id}.png`,
  default: '/images/avatars/default.png',
} as const
