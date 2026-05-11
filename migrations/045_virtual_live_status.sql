-- =====================================================
-- 045 - Estado y marcador virtual en vivo
-- Partidos muestran estado 'live' y marcador 0-0 desde la hora del kickoff
-- =====================================================

-- Recrear view match_scores para considerar partidos "virtualmente en vivo"
drop view if exists public.match_scores cascade;

create or replace view public.match_scores
with (security_invoker = true)
as
with cfg as (select * from public.settings where id = 1),
real_winner as (
  select 
    m.id as match_id,
    -- Marcador virtual: usar scores reales si existen, sino 0-0 si el partido ya inició
    case 
      when m.home_score is not null then m.home_score
      when m.status = 'finished' then 0
      when m.status = 'live' then 0
      when m.status = 'scheduled' and m.kickoff_at is not null and m.kickoff_at <= now() then 0
      else null
    end as home_score,
    case 
      when m.away_score is not null then m.away_score
      when m.status = 'finished' then 0
      when m.status = 'live' then 0
      when m.status = 'scheduled' and m.kickoff_at is not null and m.kickoff_at <= now() then 0
      else null
    end as away_score,
    -- Estado virtual: considerar 'live' si kickoff_at <= now()
    case
      when m.status = 'finished' then 'finished'
      when m.status = 'live' then 'live'
      when m.status = 'scheduled' and m.kickoff_at is not null and m.kickoff_at <= now() then 'live'
      else 'scheduled'
    end as virtual_status,
    -- Ganador solo si el partido está realmente finished
    case
      when m.status <> 'finished' then null
      when m.home_score > m.away_score then m.home_team_id
      when m.home_score < m.away_score then m.away_team_id
      else m.shootout_winner_team_id
    end as winner_team_id,
    m.phase, m.home_team_id, m.away_team_id
  from public.matches m
)
select
  p.entry_id,
  p.match_id,
  rw.phase,
  case
    -- Si el partido no ha iniciado (ni virtual ni realmente), 0 puntos
    when rw.home_score is null or rw.away_score is null then 0
    when p.home_score is null or p.away_score is null then 0
    -- Marcador exacto
    when p.home_score = rw.home_score and p.away_score = rw.away_score then
      case when rw.phase = 'group' then (select pt_exact_group from cfg)
           else (select pt_exact_ko from cfg) end
    -- Ganador correcto (mismo signo)
    when sign(p.home_score - p.away_score) = sign(rw.home_score - rw.away_score)
         and (p.home_score <> rw.home_score or p.away_score <> rw.away_score) then
      case when rw.phase = 'group' then (select pt_winner_group from cfg)
           else (select pt_winner_ko from cfg) end
    -- Knockout: empate en predicción y en marcador, ganador de penales correcto
    when rw.phase <> 'group' and p.home_score = p.away_score and rw.home_score = rw.away_score
         and p.ko_winner_team_id is not null and p.ko_winner_team_id = rw.winner_team_id then
      (select pt_winner_ko from cfg)
    else 0
  end as points
from public.predictions p
join real_winner rw on rw.match_id = p.match_id;

-- Recrear view leaderboard (depende de match_scores)
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
    when avatar_perm_id is not null then '/images/avatars/permanentes/' || avatar_perm_id || '.webp'
    else '/images/avatars/default.webp'
  end as display_avatar
from ranked_entries
order by total_points desc;

-- Restaurar permisos
grant select on public.match_scores to authenticated, anon;
grant select on public.leaderboard to authenticated, anon;

select 'Estado y marcador virtual en vivo implementados' as status;
