-- =====================================================
-- 076 - Inicializar Snapshots del Ranking
-- =====================================================
-- Crear DOS snapshots: uno "antiguo" con posiciones ligeramente diferentes
-- y uno actual, para que aparezcan los indicadores de movimiento

-- Snapshot 1: Estado "anterior" (simulado, hace 2 horas)
-- Invertimos un poco el orden para generar movimiento artificial
insert into public.ranking_snapshots (entry_id, rank, total_points, snapshot_at)
select
  entry_id,
  -- Simular ranking anterior: los primeros 5 intercambian posiciones
  case 
    when rank = 1 then 2
    when rank = 2 then 1
    when rank = 3 then 5
    when rank = 4 then 3
    when rank = 5 then 4
    else rank
  end as rank,
  -- Ajustar puntos para que sea coherente con el rank simulado
  total_points - (rank % 3) as total_points,
  now() - interval '2 hours' as snapshot_at
from public.leaderboard;

-- Snapshot 2: Estado actual (ahora)
insert into public.ranking_snapshots (entry_id, rank, total_points, snapshot_at)
select
  entry_id,
  rank,
  total_points,
  now() as snapshot_at
from public.leaderboard;

select 'Snapshots iniciales creados: ' || count(*) || ' entries (2 por entry)' as status
from public.ranking_snapshots;
