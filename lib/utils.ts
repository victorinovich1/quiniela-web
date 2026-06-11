/**
 * Utilidades centralizadas del proyecto
 * Funciones de formateo, validación y helpers reutilizables
 */

/**
 * Parsea fecha de Supabase garantizando interpretación UTC
 * Regla de Oro: Todas las fechas de BD son UTC
 * @param dateStr - String ISO de Supabase (con o sin 'Z')
 * @returns Date object interpretado como UTC
 */
export function parseUTCDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  
  // Si ya tiene 'Z' o timezone offset (+XX:XX), usar directo
  if (dateStr.endsWith('Z') || dateStr.includes('+')) {
    return new Date(dateStr)
  }
  
  // Si es formato "YYYY-MM-DD HH:MM:SS" sin timezone, agregar 'Z'
  // Normalizar espacio a 'T' para formato ISO estándar
  const normalized = dateStr.replace(' ', 'T')
  return new Date(normalized + 'Z')
}

/**
 * Formatea segundos en una cadena legible
 * @param seconds - Segundos a formatear
 * @param format - 'text' (defecto): "Xh Ym Zs" | 'clock': "HH:MM:SS"
 */
export function formatTimeLeft(seconds: number, format: 'text' | 'clock' = 'text'): string {
  if (seconds <= 0) return format === 'clock' ? '00:00' : '0s'
  
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (format === 'clock') {
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  
  // Formato 'text'
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
 * Usa parseUTCDate para fechas de BD
 */
export function getSecondsUntil(targetDate: Date | string): number {
  const target = typeof targetDate === 'string' ? parseUTCDate(targetDate) : targetDate
  if (!target) return 0
  return Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000))
}

/**
 * Calcula diferencia en milisegundos hasta una fecha
 * Para countdowns precisos sin redondeo a segundos
 */
export function getMillisecondsUntil(targetDate: Date | string): number {
  const target = typeof targetDate === 'string' ? parseUTCDate(targetDate) : targetDate
  if (!target) return 0
  return Math.max(0, target.getTime() - Date.now())
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
  
  const kickoff = parseUTCDate(match.kickoff_at)
  if (!kickoff) return false
  const now = Date.now()
  return now >= kickoff.getTime() - 15 * 60 * 1000 // 15 minutos antes
}

/**
 * Determina si un partido debe mostrar indicador "EN VIVO"
 * Unificado con getMatchStatus - usa el mismo criterio
 */
export function shouldShowLiveIndicator(match: { 
  status: string
  kickoff_at: string | null 
}): boolean {
  return getMatchStatus(match) === 'live'
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
 * Determina el estado real de un partido considerando la hora actual
 * - 'finished': status en DB es finished
 * - 'live': status es live O (status es scheduled Y kickoff_at <= now())
 * - 'scheduled': de lo contrario
 */
export function getMatchStatus(match: {
  status: string
  kickoff_at: string | null
}): 'scheduled' | 'live' | 'finished' {
  if (match.status === 'finished') return 'finished'
  if (match.status === 'live') return 'live'
  
  // Partido virtualmente en vivo si llegó la hora del kickoff
  if (match.status === 'scheduled' && match.kickoff_at) {
    const kickoff = parseUTCDate(match.kickoff_at)
    if (!kickoff) return 'scheduled'
    const now = Date.now()
    if (now >= kickoff.getTime()) return 'live'
  }
  
  return 'scheduled'
}

/**
 * Obtiene los marcadores de un partido
 * - Devuelve scores reales si existen en la DB
 * - Devuelve [0, 0] si el partido está virtualmente en vivo pero sin scores
 * - Devuelve [null, null] si el partido aún no inició
 */
export function getMatchScores(match: {
  status: string
  kickoff_at: string | null
  home_score: number | null
  away_score: number | null
}): [number | null, number | null] {
  // Si hay scores reales en la DB, usarlos siempre
  if (match.home_score !== null && match.away_score !== null) {
    return [match.home_score, match.away_score]
  }
  
  // Si el partido está virtualmente en vivo, mostrar 0-0
  const status = getMatchStatus(match)
  if (status === 'live' || status === 'finished') {
    return [0, 0]
  }
  
  // Partido aún no inició
  return [null, null]
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
 * Convierte ISO UTC string a formato 'YYYY-MM-DDTHH:mm' en hora LOCAL
 * para usar con <input type="datetime-local">
 */
export function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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
