-- =====================================================
-- DEBUG - Verificar Sistema de Movimiento en Ranking
-- =====================================================

-- IMPORTANTE: Ejecuta CADA query por separado (una a una)

-- Query 1: ¿Existe la tabla?
select count(*) as total_rows_en_tabla 
from public.ranking_snapshots;

-- Query 2: Ver snapshots directamente
select * from public.ranking_snapshots 
order by snapshot_at desc 
limit 10;

-- Query 3: Contar por entry
select entry_id, count(*) as snapshots_count
from public.ranking_snapshots
group by entry_id
order by entry_id
limit 10;

-- Query 4: Ver leaderboard actual
select 
  entry_id,
  alias,
  rank,
  total_points,
  previous_rank,
  rank_movement
from public.leaderboard
order by rank
limit 10;

-- Query 5: Ver políticas RLS
select schemaname, tablename, policyname, permissive, roles, cmd, qual
from pg_policies
where tablename = 'ranking_snapshots';
