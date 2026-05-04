# Known issues / TODO

## Pendientes de funcionalidad

### Alta prioridad
- [ ] **Resend solo manda a un email:** sin dominio verificado en Resend, los reset-password emails solo llegan al dueño del proyecto. Si un participante real pide reset, el admin tiene que ir a Supabase Dashboard → Auth → Users → "Send password recovery".

### Media prioridad
- [ ] **Auto-sync depende de configuración:** ya existe `GET /api/cron/sync-results`, pero si faltan `FOOTBALL_DATA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` o `CRON_SECRET`, no sincroniza.
- [ ] **No hay límite de jugadas por usuario.** Un usuario podría crear 100 entries. Conviene poner un máximo (ej. 5).
- [ ] **No hay paginación en /leaderboard.** Con +100 entries la página se vuelve larga.

### Baja prioridad
- [ ] **No hay vista bracket de eliminatorias.** Solo tabs por fase.
- [ ] **No hay export de datos.** Si el admin quiere descargar todos los pronósticos para análisis, no hay endpoint.
- [ ] **El campo `flag_emoji` en teams** es legacy y no se usa.
- [ ] **`profiles.alias` y `profiles.paid` son legacy** después de migrar a entries.

## Bugs conocidos

- **Borrar una entry borra sus pronósticos** (CASCADE). Es intencional, pero puede sorprender al usuario.

## Completados (histórico)

- [x] **Banderas en Admin** (2026-05-04): `AdminClient.tsx` muestra `<Flag />` junto a todos los nombres de equipos en las pestañas Equipos y Resultados. Emoji de banderas removido de la UI.
- [x] **Botón '+ Quiniela'** (2026-05-04): En `/entries`, el botón de creación cambió de "Crear jugada" a "+ Quiniela" con descripción explicativa.
- [x] **Bloqueo de eliminación de entries** (2026-05-04): Migración `018_lock_entries_deletion.sql` aplicada. RLS de `entries` DELETE bloquea a participantes tras el inicio del primer partido. Admin conserva permiso total.

## Decisiones de diseño que podrían revisarse

- **Match number** no coincide exactamente con numeración pública FIFA histórica; no afecta cálculos internos.
- **El sistema admite multi-jugada pero no multi-quiniela.** Si quisieras varias quinielas paralelas, habría que añadir tabla `pools` y FK en `entries`.

## Compatibilidad

- **Probado en:** Chrome, Firefox, Safari (desktop) y Chrome iOS/Android.
- **No probado en:** IE (no soportado), navegadores antiguos.

## Riesgos operativos

- **Plan free de Supabase** se pausa tras 7 días sin actividad.
- **flagcdn.com** es servicio de terceros.
- **Vercel Hobby** tiene límite de egress mensual.
