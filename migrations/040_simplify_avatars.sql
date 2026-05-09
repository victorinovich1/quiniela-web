-- =====================================================
-- 040 - Simplificar sistema de avatares
-- Elimina mecánica de castigos y trono del rey
-- =====================================================

-- Paso A: Eliminar view primero (libera dependencias)
drop view if exists public.leaderboard cascade;

-- Paso B: Eliminar columna avatar_temp_id
alter table public.profiles drop column if exists avatar_temp_id;

-- Paso C: Eliminar trigger y función de limpieza
drop trigger if exists clear_punishments_on_match_live on public.matches;
drop trigger if exists on_match_live_clear_avatars on public.matches;
drop function if exists public.clear_temporary_avatars();

-- Paso D: Recrear view leaderboard con lógica simplificada
create or replace view public.leaderboard
with (security_invoker = true)
as
with ranked_entries as (
  select
    e.id as entry_id,
    e.user_id,
    e.alias,
    e.paid,
    pr.display_name,
    pr.avatar_perm_id,
    coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0) as match_points,
    coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as special_points,
    coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0)
    + coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as total_points,
    row_number() over (order by 
      coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0)
      + coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) desc
    ) as rank
  from public.entries e
  join public.profiles pr on pr.id = e.user_id
)
select
  entry_id,
  user_id,
  display_name,
  alias,
  paid,
  avatar_perm_id,
  match_points,
  special_points,
  total_points,
  rank,
  case
    when avatar_perm_id is not null then '/images/avatars/permanentes/' || avatar_perm_id || '.png'
    else '/images/avatars/default.png'
  end as display_avatar
from ranked_entries
order by total_points desc;

-- Paso E: Restaurar permisos
grant select on public.leaderboard to authenticated, anon;

select 'Sistema de avatares simplificado' as status;
