-- =====================================================
-- 033 - Eliminar bonuses por equipo que avanza de fase
-- Simplificamos la quiniela: solo marcadores/ganadores y podio
-- =====================================================

-- Paso 1: Eliminar vistas existentes (dependen de columnas que vamos a borrar)
drop view if exists public.leaderboard cascade;
drop view if exists public.special_scores cascade;
drop view if exists public.match_scores cascade;
drop view if exists public.teams_in_phase cascade;

-- Paso 2: Recrear match_scores (solo marcadores exactos y ganadores)
create or replace view public.match_scores
with (security_invoker = true)
as
with cfg as (
  select pt_exact_group, pt_exact_ko, pt_winner_group, pt_winner_ko 
  from public.settings 
  where id = 1
),
real_winner as (
  select m.id as match_id,
         case
           when m.status <> 'finished' then null
           when m.home_score > m.away_score then m.home_team_id
           when m.home_score < m.away_score then m.away_team_id
           else m.shootout_winner_team_id
         end as winner_team_id,
         m.phase, m.home_score, m.away_score, m.home_team_id, m.away_team_id
  from public.matches m
)
select
  p.entry_id,
  p.match_id,
  rw.phase,
  case
    when rw.home_score is null or rw.away_score is null then 0
    when p.home_score is null or p.away_score is null then 0
    when p.home_score = rw.home_score and p.away_score = rw.away_score then
      case when rw.phase = 'group' then (select pt_exact_group from cfg)
           else (select pt_exact_ko from cfg) end
    when sign(p.home_score - p.away_score) = sign(rw.home_score - rw.away_score)
         and (p.home_score <> rw.home_score or p.away_score <> rw.away_score) then
      case when rw.phase = 'group' then (select pt_winner_group from cfg)
           else (select pt_winner_ko from cfg) end
    when rw.phase <> 'group' and p.home_score = p.away_score and rw.home_score = rw.away_score
         and p.ko_winner_team_id is not null and p.ko_winner_team_id = rw.winner_team_id then
      (select pt_winner_ko from cfg)
    else 0
  end as points
from public.predictions p
join real_winner rw on rw.match_id = p.match_id;

-- Paso 3: Recrear special_scores (solo podio: campeón, subcampeón, 3º y 4º)
create or replace view public.special_scores
with (security_invoker = true)
as
with s as (
  select pt_champion, pt_runner_up, pt_third, pt_fourth,
         champion_team_id, runner_up_team_id, third_team_id, fourth_team_id
  from public.settings 
  where id = 1
)
select
  sp.entry_id,
  ( case when sp.champion_team_id is not null and sp.champion_team_id = s.champion_team_id then s.pt_champion else 0 end
  + case when sp.runner_up_team_id is not null and sp.runner_up_team_id = s.runner_up_team_id then s.pt_runner_up else 0 end
  + case when sp.third_team_id is not null and sp.third_team_id = s.third_team_id then s.pt_third else 0 end
  + case when sp.fourth_team_id is not null and sp.fourth_team_id = s.fourth_team_id then s.pt_fourth else 0 end
  ) as points
from public.special_predictions sp
cross join s;

-- Paso 4: Recrear leaderboard (suma match_points + special_points)
create or replace view public.leaderboard
with (security_invoker = true)
as
select
  e.id as entry_id,
  e.user_id,
  e.alias,
  e.paid,
  pr.display_name,
  coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0) as match_points,
  coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as special_points,
  coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0)
  + coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0)
  as total_points
from public.entries e
join public.profiles pr on pr.id = e.user_id;

-- Paso 5: Recrear teams_in_phase (auxiliar, no cambia)
create or replace view public.teams_in_phase
with (security_invoker = true)
as
with finals as (
  select home_team_id as team_id, phase from public.matches where status = 'finished' and home_team_id is not null
  union
  select away_team_id as team_id, phase from public.matches where status = 'finished' and away_team_id is not null
)
select distinct team_id, phase from finals;

-- Paso 6: Ahora eliminar columnas de puntos por fase
alter table public.settings
  drop column if exists pt_round_of_16,
  drop column if exists pt_quarters,
  drop column if exists pt_semis;

-- Paso 7: Restaurar permisos
grant select on public.match_scores to authenticated, anon;
grant select on public.special_scores to authenticated, anon;
grant select on public.teams_in_phase to authenticated, anon;
grant select on public.leaderboard to authenticated, anon;

comment on table public.settings is 'Configuración global: bloqueos, puntos por marcador/podio, resultados especiales';
