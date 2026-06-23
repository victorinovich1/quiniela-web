-- =====================================================
-- 075 - Sistema de Tracking de Movimiento en Ranking
-- =====================================================

-- Tabla para snapshots históricos del ranking
create table if not exists public.ranking_snapshots (
  id bigint generated always as identity primary key,
  entry_id int not null references public.entries(id) on delete cascade,
  rank int not null,
  total_points int not null default 0,
  snapshot_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_ranking_snapshots_entry on public.ranking_snapshots(entry_id);
create index if not exists idx_ranking_snapshots_time on public.ranking_snapshots(snapshot_at desc);

-- RLS: Todos pueden leer snapshots
alter table public.ranking_snapshots enable row level security;

drop policy if exists snapshots_read on public.ranking_snapshots;
create policy snapshots_read on public.ranking_snapshots
  for select using (true);

grant select on public.ranking_snapshots to authenticated, anon;

-- Recrear view leaderboard con movimiento
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
    pr.avatar_category,
    pr.country_code,
    coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0) as match_points,
    coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as special_points,
    coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0)
    + coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as total_points,
    
    -- Criterios de desempate (migración 049)
    coalesce((
      select count(*)
      from public.match_scores ms
      join public.matches m on m.id = ms.match_id
      join public.settings s on true
      where ms.entry_id = e.id
        and ms.points >= (case when m.phase = 'group' then s.pt_exact_group else s.pt_exact_ko end)
    ), 0) as total_exact,
    
    coalesce((
      select count(*)
      from public.match_scores ms
      join public.matches m on m.id = ms.match_id
      where ms.entry_id = e.id
        and m.phase != 'group'
        and ms.points > 0
    ), 0) as ko_winner_count,
    
    coalesce((
      select count(*)
      from public.match_scores ms
      join public.matches m on m.id = ms.match_id
      join public.settings s on true
      where ms.entry_id = e.id
        and m.phase != 'group'
        and ms.points >= s.pt_exact_ko
    ), 0) as ko_exact_count,
    
    coalesce((
      select sum(ms.points)
      from public.match_scores ms
      join public.matches m on m.id = ms.match_id
      where ms.entry_id = e.id and m.phase != 'group'
    ), 0) as ko_points,
    
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
    end as correct_runner_up,
    
    row_number() over (order by 
      coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0)
      + coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) desc
    ) as current_rank
  from public.entries e
  join public.profiles pr on pr.id = e.user_id
),
last_snapshot as (
  select distinct on (entry_id)
    entry_id,
    rank as previous_rank
  from public.ranking_snapshots
  order by entry_id, snapshot_at desc
)
select
  re.entry_id,
  re.user_id,
  re.display_name,
  re.alias,
  re.paid,
  re.avatar_perm_id,
  re.avatar_category,
  re.country_code,
  re.match_points,
  re.special_points,
  re.total_points,
  re.total_exact,
  re.ko_winner_count,
  re.ko_exact_count,
  re.ko_points,
  re.correct_champion,
  re.correct_runner_up,
  re.current_rank as rank,
  ls.previous_rank,
  case
    when ls.previous_rank is null then 0
    else ls.previous_rank - re.current_rank
  end as rank_movement,
  case
    when re.avatar_perm_id is not null and re.avatar_category is not null 
      then '/images/avatars/' || re.avatar_category || '/' || re.avatar_perm_id || '.webp'
    when re.avatar_perm_id is not null 
      then '/images/avatars/permanentes/' || re.avatar_perm_id || '.webp'
    else '/images/avatars/default.webp'
  end as display_avatar
from ranked_entries re
left join last_snapshot ls on ls.entry_id = re.entry_id
order by re.total_points desc;

grant select on public.leaderboard to authenticated, anon;

select 'Sistema de tracking de movimiento implementado' as status;
