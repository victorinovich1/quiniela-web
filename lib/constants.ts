/**
 * Constantes globales del proyecto
 */

/**
 * ID de la fila de configuración global en la tabla settings
 * Solo existe una fila de configuración en la BD
 */
export const DEFAULT_SETTINGS_ID = 1

/**
 * Email de contacto para notificaciones Web Push (VAPID)
 * Puede ser sobrescrito por VAPID_CONTACT_EMAIL en variables de entorno
 */
export const DEFAULT_VAPID_EMAIL = 'mailto:admin@quinielamundial.com'

/**
 * Etiquetas legibles para las fases del torneo
 */
export const PHASE_LABELS: Record<string, string> = {
  group: 'Fase de Grupos',
  r32: 'Dieciseisavos de Final',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  third: 'Tercer Lugar',
  final: 'Final',
}
