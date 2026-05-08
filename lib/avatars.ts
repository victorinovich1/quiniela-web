// Configuración de avatares del sistema
// Actualiza estos valores cuando agregues más imágenes

export const TOTAL_PERM_AVATARS = 20
export const TOTAL_JOKE_AVATARS = 11

export const AVATAR_PATHS = {
  king: '/images/avatars/0.png',
  permanent: (id: number) => `/images/avatars/permanentes/${id}.png`,
  joke: (id: number) => `/images/avatars/bromas/${id}.png`,
  default: '/images/avatars/default.png',
} as const
