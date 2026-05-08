-- =====================================================
-- 039 - Fix rutas de avatares en view leaderboard
-- =====================================================

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
    pr.avatar_temp_id,
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
  avatar_temp_id,
  match_points,
  special_points,
  total_points,
  rank,
  case
    when rank = 1 then '/images/avatars/0.png'
    when avatar_temp_id is not null then '/images/avatars/bromas/' || avatar_temp_id || '.png'
    when avatar_perm_id is not null then '/images/avatars/permanentes/' || avatar_perm_id || '.png'
    else '/images/avatars/default.png'
  end as display_avatar
from ranked_entries
order by total_points desc;

select 'Rutas de avatares corregidas' as status;
