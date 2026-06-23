-- =====================================================
-- 076b - LIMPIAR Y REINICIALIZAR Snapshots
-- =====================================================
-- Si ya ejecutaste 076 y no funcionó, usa ESTE script

-- 1. Limpiar snapshots existentes
delete from public.ranking_snapshots;

-- 2. Snapshot "anterior" simulado (hace 2 horas, ranking ligeramente alterado)
insert into public.ranking_snapshots (entry_id, rank, total_points, snapshot_at)
select
  entry_id,
  case 
    when rank = 1 then 2
    when rank = 2 then 1
    when rank = 3 then 5
    when rank = 4 then 3
    when rank = 5 then 4
    else rank
  end as rank,
  total_points - (rank % 3),
  now() - interval '2 hours' as snapshot_at
from public.leaderboard;

-- 3. Snapshot actual
insert into public.ranking_snapshots (entry_id, rank, total_points, snapshot_at)
select entry_id, rank, total_points, now()
from public.leaderboard;

-- 4. Verificar
select 
  entry_id,
  count(*) as snapshots_por_entry,
  min(snapshot_at) as mas_antiguo,
  max(snapshot_at) as mas_reciente
from public.ranking_snapshots
group by entry_id
order by entry_id
limit 5;
