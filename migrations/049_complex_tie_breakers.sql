-- =====================================================
-- 049 - Sistema de desempate oficial con 6 niveles
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
    e.created_at,
    pr.display_name,
    pr.avatar_perm_id,
    pr.avatar_category,
    pr.country_code,
    coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0) as match_points,
    coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as special_points,
    coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0)
    + coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as total_points,
    
    -- total_exact: Conteo de marcadores exactos en todo el torneo
    coalesce((
      select count(*)
      from public.match_scores ms
      join public.matches m on m.id = ms.match_id
      join public.settings s on true
      where ms.entry_id = e.id
        and ms.points >= (case when m.phase = 'group' then s.pt_exact_group else s.pt_exact_ko end)
    ), 0) as total_exact,
    
    -- ko_winner_count: Conteo de ganadores acertados solo en fases eliminatorias
    coalesce((
      select count(*)
      from public.match_scores ms
      join public.matches m on m.id = ms.match_id
      where ms.entry_id = e.id
        and m.phase != 'group'
        and ms.points > 0
    ), 0) as ko_winner_count,
    
    -- ko_exact_count: Conteo de marcadores exactos solo en fases eliminatorias
    coalesce((
      select count(*)
      from public.match_scores ms
      join public.matches m on m.id = ms.match_id
      join public.settings s on true
      where ms.entry_id = e.id
        and m.phase != 'group'
        and ms.points >= s.pt_exact_ko
    ), 0) as ko_exact_count,
    
    -- ko_points: Sumatoria de puntos obtenidos solo en fases eliminatorias
    coalesce((
      select sum(ms.points)
      from public.match_scores ms
      join public.matches m on m.id = ms.match_id
      where ms.entry_id = e.id
        and m.phase != 'group'
    ), 0) as ko_points,
    
    -- correct_champion: Booleano (1 o 0) si acertó el campeón
    case
      when exists (
        select 1
        from public.special_predictions sp
        join public.settings s on true
        where sp.entry_id = e.id
          and sp.champion_team_id is not null
          and s.champion_team_id is not null
          and sp.champion_team_id = s.champion_team_id
      ) then 1
      else 0
    end as correct_champion,
    
    -- correct_runner_up: Booleano (1 o 0) si acertó el subcampeón
    case
      when exists (
        select 1
        from public.special_predictions sp
        join public.settings s on true
        where sp.entry_id = e.id
          and sp.runner_up_team_id is not null
          and s.runner_up_team_id is not null
          and sp.runner_up_team_id = s.runner_up_team_id
      ) then 1
      else 0
    end as correct_runner_up
    
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
  avatar_category,
  country_code,
  match_points,
  special_points,
  total_points,
  total_exact,
  ko_winner_count,
  ko_exact_count,
  ko_points,
  correct_champion,
  correct_runner_up,
  row_number() over (
    order by 
      total_points desc,
      total_exact desc,
      ko_winner_count desc,
      ko_exact_count desc,
      ko_points desc,
      correct_champion desc,
      correct_runner_up desc,
      created_at asc
  ) as rank,
  case
    when avatar_perm_id is not null and avatar_category is not null 
      then '/images/avatars/' || avatar_category || '/' || avatar_perm_id || '.webp'
    when avatar_perm_id is not null 
      then '/images/avatars/permanentes/' || avatar_perm_id || '.webp'
    else '/images/avatars/default.webp'
  end as display_avatar
from ranked_entries
order by 
  total_points desc,
  total_exact desc,
  ko_winner_count desc,
  ko_exact_count desc,
  ko_points desc,
  correct_champion desc,
  correct_runner_up desc,
  created_at asc;

grant select on public.leaderboard to authenticated, anon;

select 'Sistema de desempate oficial implementado con 6 niveles' as status;
