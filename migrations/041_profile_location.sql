-- =====================================================
-- 041 - Añadir country_code a profiles
-- Columna para guardar código ISO del país del usuario
-- =====================================================

-- Añadir columna country_code
alter table public.profiles 
add column if not exists country_code text;

-- Recrear view leaderboard para incluir country_code
drop view if exists public.leaderboard cascade;

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
    pr.country_code,
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
  country_code,
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

-- Restaurar permisos
grant select on public.leaderboard to authenticated, anon;

select 'Columna country_code añadida y view leaderboard actualizada' as status;
