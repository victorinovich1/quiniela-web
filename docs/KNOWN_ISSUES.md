# Known issues / TODO

## Pendientes de funcionalidad

### Alta prioridad
- [ ] **Dominio verificado en Resend:** Actualmente los emails de recuperación de contraseña solo llegan al email verificado en Resend (el dueño del proyecto). Para que funcione con todos los participantes, se necesita:
  1. Verificar un dominio propio en Resend (ej. `quiniela2026.com`)
  2. Configurar DNS (SPF, DKIM)
  3. Actualizar `NEXT_PUBLIC_SITE_URL` en variables de entorno
  
  **Workaround actual:** El admin puede enviar recovery emails manualmente desde Supabase Dashboard → Auth → Users → "Send password recovery".

### Media prioridad
- [ ] **Auto-sync depende de configuración:** ya existe `GET /api/cron/sync-results`, pero si faltan `FOOTBALL_DATA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` o `CRON_SECRET`, no sincroniza.
- [ ] **No hay límite de quinielas por usuario.** Un usuario podría crear 100 entries. Conviene poner un máximo (ej. 5).
- [ ] **No hay paginación en /leaderboard.** Con +100 entries la página se vuelve larga.

### Baja prioridad
- [ ] **No hay vista bracket de eliminatorias.** Solo tabs por fase.
- [ ] **No hay export de datos.** Si el admin quiere descargar todos los pronósticos para análisis, no hay endpoint.
- [ ] **El campo `flag_emoji` en teams** es legacy y no se usa.
- [ ] **`profiles.alias` y `profiles.paid` son legacy** después de migrar a entries.

## Bugs conocidos

- **Borrar una entry borra sus pronósticos** (CASCADE). Es intencional, pero puede sorprender al usuario.

## Completados (histórico)

- [x] **Flujo de Recuperación de Contraseña** (2026-05-04): Implementado flujo completo `/forgot-password` → email → `/reset-password`. Detección automática de URL (producción/local) usando `window.location.origin`. Mensajes de UX mejorados con mejor manejo de errores y enlaces expirados. Funcionalmente completo, pendiente solo configurar dominio verificado en Resend para uso con todos los participantes.
- [x] **Página de Perfil de Usuario** (2026-05-04): Agregada ruta `/profile` con formulario para editar nombre de pantalla y cambiar contraseña. Accesible desde Navbar (desktop) y BottomNav (mobile).
- [x] **Banderas en Admin** (2026-05-04): `AdminClient.tsx` muestra `<Flag />` junto a todos los nombres de equipos en las pestañas Equipos y Resultados. Emoji de banderas removido de la UI.
- [x] **Terminología 'Mis Quinielas'** (2026-05-09): El término 'jugadas' fue reemplazado por 'quinielas' en toda la aplicación (navegación, mensajes, documentación) para mayor claridad conceptual. El modelo de datos (tabla `entries`) permanece sin cambios.
- [x] **Bloqueo de eliminación de entries** (2026-05-04): Migración `018_lock_entries_deletion.sql` aplicada. RLS de `entries` DELETE bloquea a participantes tras el inicio del primer partido. Admin conserva permiso total.

## Decisiones de diseño que podrían revisarse

- **Match number** no coincide exactamente con numeración pública FIFA histórica; no afecta cálculos internos.
- **El sistema admite múltiples quinielas por usuario pero no múltiples pools.** Si quisieras varios grupos/quinielas paralelas con participantes distintos, habría que añadir tabla `pools` y FK en `entries`. Actualmente todos participan en una única quiniela global.

## Compatibilidad

- **Probado en:** Chrome, Firefox, Safari (desktop) y Chrome iOS/Android.
- **No probado en:** IE (no soportado), navegadores antiguos.

## Riesgos operativos

- **Plan free de Supabase** se pausa tras 7 días sin actividad.
- **flagcdn.com** es servicio de terceros.
- **Vercel Hobby** tiene límite de egress mensual.
