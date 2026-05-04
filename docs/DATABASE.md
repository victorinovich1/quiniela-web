# Base de datos

Postgres 17 en Supabase (eu-west-1, project ref `yzxdsujooaujstzufwyu`).

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
| `role` | text | `'participant'` o `'admin'`. Hardcoded admin: email = `victorinovich@gmail.com` |
| `created_at` | timestamptz | |

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
| `kickoff_at` | timestamptz | UTC |
| `home_team_id` | int → teams | NULL en KO antes de saber el rival |
| `away_team_id` | int → teams | NULL en KO antes de saber el rival |
| `home_team_label` | text | Texto descriptivo p.ej. "Ganador M73" para KO |
| `away_team_label` | text | |
| `home_score` | int | Resultado real (NULL si no jugado) |
| `away_score` | int | |
| `shootout_winner_team_id` | int | Si KO se define en penales |
| `status` | text | `scheduled`, `live`, `finished` |
| `stadium` | text | "Estadio Azteca, Ciudad de México" |
| `updated_at` | timestamptz | |

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
| `top_scorer` | text | Nombre del jugador (texto libre) |
| `mvp` | text | |
| `best_goalkeeper` | text | |
| `revelation_team_id` | int → teams | |
| `disappointment_team_id` | int → teams | |
| `updated_at` | timestamptz | |

### `settings`
Single-row table (id=1). Configuración global + sistema de puntos + resultados oficiales especiales.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | smallint PK = 1 | Constraint `id = 1` |
| `lock_at` | timestamptz | Cuándo se cierran pronósticos |
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

## Views (security_invoker = true)

### `match_scores`
Por `(entry_id, match_id, phase)` da los `points` del pronóstico contra el resultado real. Lógica:
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

### `redeem_invite(p_code text) returns bool`
Marca un código como usado por el usuario actual. Valida disponibilidad, expiración, y email match.
Security definer. Acceso: solo `authenticated`.

### `validate_invite(p_code text, p_email text) returns bool`
Lectura: ¿es válido? Sin marcarlo usado.
Security definer. Acceso: `anon`, `authenticated` (se llama antes del signup).

### `handle_new_user()` (trigger)
Función trigger ejecutada `after insert on auth.users`. Crea fila en `profiles` con `role='admin'` si email coincide con `victorinovich@gmail.com`, sino `'participant'`.

### `touch_updated_at()` (trigger)
Setea `new.updated_at = now()`. Usado en triggers BEFORE UPDATE.

## RLS — patrones

### Lectura pública (todo el mundo)
- `teams`, `matches`, `settings` (parciales): SELECT abierto para que cualquiera vea calendarios y configs.

### Lectura solo después del lock o solo del propio
- `predictions`, `special_predictions`: solo lees las tuyas, EXCEPTO si `predictions_locked() = true` (entonces todo el mundo ve los pronósticos de todos — es público después del cierre).

### Escritura solo del propio Y antes del lock
- `predictions`, `special_predictions`, `entries`: insert/update/delete solo permitidos si la entry pertenece al usuario actual (`exists(select 1 from entries where id=entry_id and user_id=auth.uid())`) Y `not predictions_locked()`.

### Admin tiene acceso total
- Todas las tablas: policy `for all using (is_admin()) with check (is_admin())`.

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
