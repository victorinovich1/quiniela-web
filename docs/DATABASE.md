# Base de datos

Postgres 17 en Supabase.

## Reglas para cambios de schema

1. **Nunca editar una migración existente.** Crea una nueva con el siguiente número.
2. **Numera secuencial:** `017_descripcion_corta.sql`, `018_...`, etc.
3. **Nombres en snake_case en inglés.**
4. **Toda tabla nueva debe tener RLS desde el primer momento.**
5. **Tras aplicar DDL,** corre `get_advisors` y resuelve los warnings.
6. **Las views que necesitan RLS deben crearse con** `with (security_invoker = true)`.
7. **Las funciones SECURITY DEFINER deben tener** `set search_path = public`.

## Aplicar migración

Vía Supabase MCP (recomendado):
```
apply_migration(name="017_xxx", query="...")
```

Manual (sin MCP): copiar/pegar el SQL en el SQL Editor de Supabase Dashboard.

## Tablas

### `profiles`
Extiende `auth.users`. Una fila por usuario, creada automáticamente por trigger `on_auth_user_created`.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | FK a `auth.users.id` (CASCADE) |
| `email` | text | Cacheado del auth |
| `display_name` | text | Mostrado al organizador |
| `alias` | text | Legacy — ahora el alias vive en `entries` |
| `favorite_team_id` | int | Opcional |
| `paid` | bool | Legacy — ahora `paid` vive en `entries` |
| `role` | text | `'participant'`, `'manager'` o `'admin'`. Hardcoded admin: email = `victorinovich@gmail.com` |
| `avatar_perm_id` | int | ID del avatar seleccionado (1-75). NULL = avatar default |
| `avatar_category` | text | Categoría del avatar: 'permanentes', 'especiales', 'premium', 'leyendas' |
| `country_code` | text | Código ISO alpha-2 del país (ej. 'mx', 'ar'). Opcional. |
| `created_at` | timestamptz | |

**Constraint:** `profiles_avatar_category_id_unique` sobre `(avatar_category, avatar_perm_id)` — permite el mismo ID en diferentes categorías.

### `entries` (jugadas)
Una jugada = una participación independiente en el ranking. Un usuario puede tener N entries.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | serial PK | |
| `user_id` | uuid | FK a `auth.users(id)` (CASCADE) |
| `alias` | text | Único por user. Aparece en el ranking. |
| `paid` | bool | Marcado por admin |
| `created_at` | timestamptz | |

**RLS entries DELETE (migración 018):**
- Usuarios autenticados solo pueden borrar sus propias entries **antes** de `min(kickoff_at)` de `matches`.
- Admins (`is_admin()`) pueden borrar cualquier entry en cualquier momento.
- Una vez iniciado el primer partido, `delete` de usuario falla silenciosamente (la policy no aplica).

### `teams`
48 selecciones del Mundial. Cargadas en migración 005, renombradas con datos oficiales en 008.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | serial PK | |
| `code` | text UNIQUE | FIFA 3-letter (`MEX`, `BRA`, etc.) |
| `name` | text | Nombre en español (`México`, `Brasil`, etc.) |
| `group_code` | char(1) | `'A'` a `'L'` |
| `flag_emoji` | text | Emoji unicode (no usado en UI por compat Windows) |
| `iso_code` | text | Código 2-letras para flagcdn (`mx`, `gb-eng`, `gb-sct`, etc.) |
| `position_in_group` | smallint | 1–4 (define los matchups dentro del grupo) |

### `matches`
104 partidos. Se referencian por `match_number` (1–104). Group stage: 1–72. R32: 73–88. R16: 89–96. QF: 97–100. SF: 101–102. 3rd: 103. Final: 104.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | serial PK | |
| `phase` | text | `group`, `r32`, `r16`, `qf`, `sf`, `third`, `final` |
| `group_code` | text | Solo para `group` (`A`–`L`) |
| `match_number` | int | Único por phase. Numeración global 1–104. |
| `kickoff_at` | timestamptz | UTC. Se usa para estado virtual (si `kickoff_at < now()` → `'live'`) |
| `home_team_id` | int → teams | NULL en KO antes de saber el rival |
| `away_team_id` | int → teams | NULL en KO antes de saber el rival |
| `home_team_label` | text | Texto descriptivo p.ej. "Ganador M73" para KO |
| `away_team_label` | text | |
| `home_score` | int | Resultado real (NULL si no jugado) |
| `away_score` | int | |
| `shootout_winner_team_id` | int | Si KO se define en penales |
| `status` | text | `scheduled`, `live`, `finished`. Sincronizado desde API. |
| `stadium` | text | "Estadio Azteca, Ciudad de México" — Poblado desde migración 048 con datos oficiales FIFA |
| `last_synced_at` | timestamptz | Timestamp de última actualización desde API |
| `updated_at` | timestamptz | |

**Estado Virtual:** Si `status='scheduled'` pero `kickoff_at <= now()`, la UI muestra el partido como "EN VIVO" con marcador 0-0.

### `predictions`
Pronósticos de un usuario para un partido específico. PK compuesta `(entry_id, match_id)`.

| Columna | Tipo | Notas |
|---------|------|-------|
| `entry_id` | int → entries | PK + FK |
| `match_id` | int → matches | PK + FK |
| `home_score` | int | Pronóstico |
| `away_score` | int | Pronóstico |
| `ko_winner_team_id` | int → teams | Solo para empates en KO (penales) |
| `updated_at` | timestamptz | |

### `special_predictions`
Una fila por entry con todas sus predicciones especiales. PK = `entry_id`.

| Columna | Tipo | Notas |
|---------|------|-------|
| `entry_id` | int → entries | PK |
| `champion_team_id` | int → teams | |
| `runner_up_team_id` | int → teams | |
| `third_team_id` | int → teams | |
| `fourth_team_id` | int → teams | |
| `updated_at` | timestamptz | |

### `settings`
Single-row table (id=1). Configuración global + sistema de puntos + resultados oficiales especiales + umbrales de avatares.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | smallint PK = 1 | Constraint `id = 1` |
| `lock_at` | timestamptz | Cuándo se cierran pronósticos (solo afecta podio) |
| `pt_exact_group` | int | Default 5 |
| `pt_winner_group` | int | Default 2 |
| `pt_exact_ko` | int | Default 8 |
| `pt_winner_ko` | int | Default 4 |
| `pt_round_of_16` | int | Default 3 (bonus por equipo en R16) |
| `pt_quarters` | int | Default 5 |
| `pt_semis` | int | Default 8 |
| `pt_champion` | int | Default 25 |
| `pt_runner_up` | int | Default 15 |
| `pt_third` | int | Default 10 |
| `pt_fourth` | int | Default 6 |
| `pt_top_scorer` | int | Default 15 |
| `pt_mvp` | int | Default 10 |
| `pt_goalkeeper` | int | Default 8 |
| `pt_revelation` | int | Default 8 |
| `pt_disappointment` | int | Default 5 |
| `champion_team_id` | int | Resultado oficial (admin lo llena al final) |
| `runner_up_team_id` | int | |
| `third_team_id` | int | |
| `fourth_team_id` | int | |
| `top_scorer` | text | Jugador real |
| `mvp` | text | |
| `best_goalkeeper` | text | |
| `revelation_team_id` | int | |
| `disappointment_team_id` | int | |
| `req_pts_special` | int | Pts requeridos para avatares Especiales (default 30) |
| `req_exact_special` | int | Exactos requeridos para avatares Especiales (default 3) |
| `req_pts_premium` | int | Pts requeridos para avatares Premium (default 70) |
| `req_exact_premium` | int | Exactos requeridos para avatares Premium (default 7) |
| `req_pts_legend` | int | Pts requeridos para avatares Leyendas (default 120) |
| `req_exact_legend` | int | Exactos requeridos para avatares Leyendas (default 12) |
| `sync_interval_minutes` | int | Intervalo de sincronización automática (default 10) |
| `last_sync_at` | timestamptz | Timestamp de última sincronización exitosa |

**Lógica de desbloqueo:** Se desbloquea si cumple **CUALQUIERA** de los dos requisitos (pts OR exactos).

### `invitations`

| Columna | Tipo | Notas |
|---------|------|-------|
| `code` | text PK | Ej: `MUNDIAL-AB12` |
| `note` | text | A quién va dirigido |
| `email` | text | Opcional — restringe el código a este email |
| `used_by` | uuid → auth.users | NULL si disponible |
| `used_at` | timestamptz | |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | NULL si nunca expira |

### `notifications`
Sistema de notificaciones en tiempo real (Realtime habilitado). Cada usuario puede tener hasta 15 notificaciones; las más antiguas se eliminan automáticamente.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `user_id` | uuid → profiles | FK CASCADE. Usuario destinatario |
| `title` | text | Título de la notificación |
| `message` | text | Cuerpo del mensaje |
| `type` | text | `info`, `success`, `warning`, `error`, `match_update`, `ranking_update` |
| `read` | bool | Default `false`. Marca si el usuario la leyó |
| `link` | text | URL opcional a la que redirigir al hacer clic |
| `batch_id` | uuid | Agrupa envíos masivos. NULL si es individual |
| `created_at` | timestamptz | Default `now()` |

**Realtime:** Tabla habilitada en `supabase_realtime` publication. Los clientes pueden suscribirse con:
```ts
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Recibir notificación en tiempo real
  })
  .subscribe()
```

**Auto-limpieza:** Trigger `cleanup_notification_trigger` ejecuta `cleanup_old_notifications()` tras cada INSERT. Si el usuario supera 15 notificaciones, elimina las más antiguas.

**batch_id:** UUID compartido por todas las notificaciones enviadas en un mismo lote (ej: envío masivo a todos los usuarios). Permite eliminar todo el lote de una vez.

**Funciones Admin:**
- `admin_delete_notification_batch(p_batch_id uuid)`: Elimina todas las notificaciones con ese `batch_id`. Solo admin/manager.
- `admin_clear_all_notifications()`: Vacía la tabla completa. Solo admin/manager. Requiere doble confirmación en UI.

**RLS:**
- `SELECT`: Usuario solo ve sus propias notificaciones
- `UPDATE`: Usuario solo puede actualizar (`read = true`) sus propias notificaciones
- `DELETE`: Usuario solo puede eliminar sus propias notificaciones
- `INSERT`: Service role puede insertar (usado por funciones SECURITY DEFINER)

## Views (security_invoker = true)

### `match_scores`
Por `(entry_id, match_id, phase)` da los `points` del pronóstico contra el resultado real. Lógica:, exact_count, avatar_category, display_avatar, country_code`.

**Columnas adicionales:** + columna `is_exact = true`
- Si solo el ganador es correcto: `pt_winner_group` o `pt_winner_ko` + `is_exact = false`
- En KO con empate, mira `ko_winner_team_id` vs `shootout_winner_team_id`

**Columna `is_exact`:** Boolean que indica si el marcador fue exacto. Usado por `leaderboard` para sumar `exact_count`.
- `display_avatar`: Path dinámico construido como `/images/avatars/{category}/{id}.webp`, o `default.webp` si NULL
- `country_code`: Código ISO del país del usuario (para bandera en ranking)

**Construcción de `display_avatar`:**
```sql
CASE 
  WHEN p.avatar_perm_id IS NULL THEN '/images/avatars/default.webp'
  ELSE '/images/avatars/' || COALESCE(p.avatar_category, 'permanentes') || '/' || p.avatar_perm_id || '.webp'
END as display_avatar
```
- Si match no está `finished`: 0
- Si pronóstico exacto: `pt_exact_group` o `pt_exact_ko`
- Si solo el ganador es correcto: `pt_winner_group` o `pt_winner_ko`
- En KO con empate, mira `ko_winner_team_id` vs `shootout_winner_team_id`

### `special_scores`
Por `entry_id` suma puntos de las 9 predicciones especiales contra `settings.*`. Compara textos con `lower(trim(...))` para tolerar mayúsculas/espacios.

### `leaderboard`
Por entry: `entry_id, user_id, alias, paid, display_name, match_points, special_points, total_points`.

### `teams_in_phase`
Helper view: distinct `(team_id, phase)` para equipos que llegaron a cada fase. Útil para bonus por avance.

## Funciones / RPCs

### `is_admin() returns bool`
Retorna true si el caller es admin. Security definer (necesita leer profiles bypassando RLS).
Acceso: solo `authenticated`.

### `predictions_locked() returns bool`
True si `settings.lock_at < now()`. Sin params.
Acceso: `authenticated`, `anon`.

### `can_predict_match(p_match_id int) returns bool`
True si faltan más de 15 minutos para el kickoff del partido. Permite pronosticar hasta 15 min antes del inicio.
Acceso: `authenticated`.

### `tournament_started() returns bool`
True si ya hay al menos un partido con `kickoff_at` en el pasado. Usado para bloquear borrado de entries.
Acceso: `authenticated`.

### `redeem_invite(p_code text) returns bool`
Marca un código como usado por el usuario actual. Valida disponibilidad, expiración, y email match.
Security definer. Acceso: solo `authenticated`.

### `validate_invite(p_code text, p_email text) returns bool`
Lectura: ¿es válido? Sin marcarlo usado.
Security definer. Acceso: `anon`, `authenticated` (se llama antes del signup).

### `handle_new_user()` (trigger)
Función trigger ejecutada `after insert on auth.users`. Crea fila en `profiles` con `role='admin'` si email coincide con `victorinovich@gmail.com`, sino `'participant'`. Los managers se asignan manualmente desde el panel de administración.

### `touch_updated_at()` (trigger)
Setea `new.updated_at = now()`. Usado en triggers BEFORE UPDATE.

### `admin_delete_user(target_user_id uuid)` y `delete_user_self()`
Funciones para eliminación de usuarios. `admin_delete_user` permite a admins eliminar cualquier usuario (y sus datos en cascada). `delete_user_self` permite a un usuario eliminarse a sí mismo. Security definer.

## Blindaje de Seguridad (migraciones 034 + 050)

Todas las funciones `SECURITY DEFINER` han sido blindadas contra ataques de path manipulation y ejecuciones no autorizadas.

**Migración 050 (Final Security Lockdown):** Implementación robusta con bloque DO $$ que procesa las 8 funciones críticas de forma programática, garantizando:

1. **REVOKE ALL** — Limpia permisos previos (PUBLIC, anon, authenticated)
2. **ALTER FUNCTION ... SET search_path = public** — Corrige el warning "Search Path Mutable" del Security Advisor
3. **GRANT EXECUTE** — Otorga permisos mínimos necesarios
4. **ANALYZE** — Refresca estadísticas de BD tras cambios de permisos

Esta migración resuelve permanentemente los 10 avisos de seguridad del Security Advisor de Supabase.

### Funciones blindadas

| Función | Acceso |
|---------|--------|
| `can_predict_match(int)` | authenticated |
| `tournament_started()` | authenticated |
| `admin_delete_user(uuid)` | authenticated |
| `delete_user_self()` | authenticated |
| `validate_invite(text, text)` | **anon, authenticated** |
| `is_admin()` | authenticated |
| `is_super_admin()` | authenticated |
| `redeem_invite(text)` | authenticated |

**Excepción importante:** `validate_invite` mantiene acceso para usuarios anónimos (`anon`) porque se llama desde la página de registro **antes** de que el usuario esté autenticado. Esta función solo lee datos (no modifica) y es esencial para el flujo de signup con código de invitación.

## RLS — patrones

### Lectura pública (todo el mundo)
- `teams`, `matches`, `settings` (parciales): SELECT abierto para que cualquiera vea calendarios y configs.

### Lectura solo después del lock o solo del propio
- `predictions`, `special_predictions`: solo lees las tuyas, EXCEPTO si `predictions_locked() = true` (entonces todo el mundo ve los pronósticos de todos — es público después del cierre).

### Escritura solo del propio Y antes del lock
- `predictions`: INSERT/UPDATE solo si la entry pertenece al usuario (`exists(select 1 from entries where id=entry_id and user_id=auth.uid())`) Y `can_predict_match(match_id)` (más de 15 min antes del kickoff).
- `special_predictions`: INSERT/UPDATE solo si la entry es propia Y `not predictions_locked()`.
- `entries`: INSERT/UPDATE solo si es propia Y `not predictions_locked()`. DELETE solo si es propia Y `not tournament_started()`.

### Admin y Manager
- **is_admin()**: Devuelve true para roles 'admin' y 'manager'. Permite acceso de lectura a `profiles` e `invitations`, y escritura en `invitations`.
- **is_super_admin()**: Devuelve true solo para rol 'admin'. Permite escritura total en `teams`, `matches`, `settings`, `entries`, `predictions`, `special_predictions`.
- Managers pueden:
  - SELECT: `profiles`, `invitations`
  - INSERT/UPDATE/DELETE: `invitations`
- Solo admins pueden modificar: resultados, equipos, configuración, entries de usuarios.

## Re-ejecutar todas las migraciones (recovery)

Si necesitas recrear la BD desde cero (ej. nuevo proyecto Supabase), ejecuta los archivos SQL de `migrations/` en orden numérico (001, 002, ..., 016). Cada uno está completo y reproducible.

```sql
-- En SQL Editor de Supabase, copiar cada archivo en orden y ejecutar.
```

## Inspección rápida

Útiles para debugging:

```sql
-- ¿Cuántos partidos hay finalizados?
SELECT COUNT(*) FROM matches WHERE status = 'finished';

-- Ver leaderboard
SELECT * FROM leaderboard ORDER BY total_points DESC LIMIT 10;

-- ¿Cuántos pronósticos lleva cada entry?
SELECT entry_id, COUNT(*) FROM predictions GROUP BY entry_id ORDER BY 2 DESC;

-- ¿Quiénes pagaron?
SELECT p.display_name, e.alias, e.paid
FROM entries e JOIN profiles p ON p.id = e.user_id
ORDER BY p.display_name, e.alias;

-- Códigos de invitación disponibles
SELECT code, note FROM invitations WHERE used_by IS NULL ORDER BY created_at DESC;
```
