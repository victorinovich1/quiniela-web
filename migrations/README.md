# Migraciones SQL

Cada archivo en este directorio es una migración aplicada a la base de datos en orden numérico.

## Cómo ejecutar todas (recovery / nuevo entorno)

Si necesitas recrear la BD desde cero:

1. Abre Supabase Dashboard → SQL Editor
2. Copia y pega el contenido de `001_core_schema.sql` → Run
3. Repite con `002_*.sql`, `003_*.sql`, ... `017_*.sql` en orden

O usa Supabase MCP `apply_migration(name, query)` si tienes un agente con acceso.

## Histórico

| # | Nombre | Qué hace |
|---|--------|----------|
| 001 | core_schema | Tablas base: profiles, settings, invitations, teams, matches, predictions, special_predictions + triggers |
| 002 | rls_policies | RLS habilitado + policies en cada tabla + funciones helper `is_admin()`, `predictions_locked()` |
| 003 | scoring_views | Views: match_scores, special_scores, teams_in_phase, leaderboard |
| 004 | invite_rpc | Funciones `redeem_invite(code)` y `validate_invite(code, email)` |
| 005 | seed_teams_and_matches | 48 equipos placeholder + 104 partidos |
| 006 | fix_security_advisors | Convierte views a security_invoker + fija search_path en funciones |
| 007 | auto_admin | Trigger handle_new_user marca a `tu-email-admin@ejemplo.com` como admin |
| 008 | real_teams_2026 | Carga nombres oficiales del sorteo Mundial 2026 + flag_emoji |
| 009 | multi_jugada_entries_v2 | Nueva tabla `entries` + migra predictions/specials de user_id a entry_id |
| 010 | recreate_views_with_entries | Recrea las views con la nueva estructura entry_id |
| 011 | disable_pg_graphql | Desactiva extensión pg_graphql (limpia warnings) |
| 012 | lock_down_security_definer_functions | Restringe EXECUTE en funciones SECURITY DEFINER |
| 013 | match_schedule | Carga aproximada de fechas en kickoff_at + setea lock_at |
| 014 | add_stadium_column | `alter table matches add column stadium` |
| 015 | official_schedule_and_stadiums | Sobrescribe ~50 partidos con datos oficiales (FIFA + medios) |
| 016 | add_iso_code | `alter table teams add column iso_code` + carga 48 ISO codes |
| 017 | official_full_schedule_fifa | Actualiza los 104 partidos con horario + estadio desde API oficial FIFA (season 285023) |
| 018 | lock_entries_deletion | RLS política que impide borrar entries después del lock_at |
| 027 | time_based_locking | Sistema de bloqueo granular: partidos se bloquean 15 min antes de kickoff (función can_predict_match) |
| 028 | fix_official_stadium_names | Corrige nombres oficiales de estadios sobrescritos por API |
| 038 | avatar_war_system | Sistema de avatares: columnas avatar_perm_id (UNIQUE) y avatar_temp_id, trigger auto-limpia castigos al iniciar partido, view leaderboard con display_avatar |
| 039 | fix_avatar_paths | Corrige rutas de avatares en view leaderboard para usar subcarpetas /permanentes/ y /bromas/ |
| 040 | simplify_avatars | Elimina mecánica de castigos: drop avatar_temp_id, drop trigger/función, view simplificada con solo avatares permanentes |
| 041 | profile_location | Añade columna country_code a profiles, actualiza view leaderboard para incluir país |
| 056 | official_fifa_104_matches | (Renombrada desde 027) Carga completa de los 104 partidos del Mundial 2026 |
| 057 | sync_team_names_fifa | (Renombrada desde 028) Sincroniza nombres de equipos con datos oficiales FIFA |
| 063 | fix_manager_invitation_rights | Funci�n is_manager_or_admin() y RLS policies actualizadas para permitir a Manager gestionar invitaciones |
| 064 | add_last_full_check_at | Columna last_full_check_at en settings para rastrear verificaciones manuales completas |

## Notas de reorganización (2026-06-03)

Las migraciones 027 y 028 tenían duplicados. Se renombraron a 056 y 057 respectivamente:
- `027_official_fifa_104_matches.sql` → `056_official_fifa_104_matches.sql`
- `028_sync_team_names_fifa.sql` → `057_sync_team_names_fifa.sql`

La migración `027_time_based_locking.sql` (más antigua) permanece como 027.
La migración `028_fix_official_stadium_names.sql` permanece como 028.

## Convenciones

- Numeración secuencial 3 dígitos. NO reutilizar números.
- Nombres en `snake_case` describiendo el cambio.
- Todo DDL es idempotente (`if not exists`, `if exists`) cuando es razonable.
- Nunca editar migraciones aplicadas. Crear una nueva con el cambio.
