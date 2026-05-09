/**
 * Utilidades centralizadas del proyecto
 * Funciones de formateo, validación y helpers reutilizables
 */

/**
 * Formatea segundos en una cadena legible (Xh Ym Zs o Xm Ys)
 */
export function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m ${s}s` : `${h}h ${s}s`
  }
  if (m > 0) {
    return `${m}m ${s}s`
  }
  return `${s}s`
}

/**
 * Calcula tiempo restante hasta una fecha en segundos
 */
export function getSecondsUntil(targetDate: Date | string): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  return Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000))
}

/**
 * Valida si un partido está bloqueado para pronósticos
 * Bloqueado si: status no es 'scheduled', o faltan menos de 15 min para kickoff
 */
export function isMatchLocked(
  match: { status: string; kickoff_at: string | null },
  globalLocked: boolean
): boolean {
  if (globalLocked) return true
  if (match.status !== 'scheduled') return true
  if (!match.kickoff_at) return false
  
  const kickoff = new Date(match.kickoff_at).getTime()
  const now = Date.now()
  return now >= kickoff - 15 * 60 * 1000 // 15 minutos antes
}

/**
 * Determina si un partido debe mostrar indicador "EN VIVO"
 * (status='scheduled' pero pasaron >5 min de kickoff)
 */
export function shouldShowLiveIndicator(match: { 
  status: string
  kickoff_at: string | null 
}): boolean {
  if (match.status !== 'scheduled') return false
  if (!match.kickoff_at) return false
  
  const kickoff = new Date(match.kickoff_at).getTime()
  const now = Date.now()
  return now >= kickoff + 5 * 60 * 1000 // 5 minutos después
}

/**
 * Formatea fecha en zona horaria del usuario
 */
export function formatLocalDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', options)
}

/**
 * Formatea fecha y hora en zona horaria del usuario
 */
export function formatLocalDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }
  return d.toLocaleString('es-ES', defaultOptions)
}

/**
 * Obtiene la zona horaria del usuario
 */
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * Valida si un valor es un número entero válido >= 0
 */
export function isValidScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

/**
 * Parsea un string a número o retorna null
 */
export function parseScore(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const num = Number(trimmed)
  return isValidScore(num) ? num : null
}

/**
 * Clona un objeto simple (no deep clone, solo para objetos planos)
 */
export function shallowClone<T extends Record<string, unknown>>(obj: T): T {
  return { ...obj }
}

/**
 * Debounce function para evitar llamadas excesivas
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Verifica si estamos en entorno de producción
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Logger condicional: solo imprime en desarrollo
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (!isProduction()) console.log(...args)
  },
  warn: (...args: unknown[]) => {
    if (!isProduction()) console.warn(...args)
  },
  error: (...args: unknown[]) => {
    // Errors siempre se muestran
    console.error(...args)
  },
}
