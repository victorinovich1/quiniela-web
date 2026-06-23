-- =====================================================
-- 076 - Inicializar Snapshots del Ranking
-- =====================================================
-- Poblar ranking_snapshots con el estado actual del ranking
-- para que empiecen a aparecer los indicadores de movimiento

insert into public.ranking_snapshots (entry_id, rank, total_points, snapshot_at)
select
  entry_id,
  rank,
  total_points,
  now() - interval '1 hour' as snapshot_at
from public.leaderboard
on conflict do nothing;

select 'Snapshots iniciales creados: ' || count(*) || ' entries' as status
from public.ranking_snapshots;
