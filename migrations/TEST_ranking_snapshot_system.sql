-- =====================================================
-- TEST - Verificar Sistema de Tendencia de Ranking
-- =====================================================

-- 1. Ver estado actual de last_known_rank
SELECT 
  p.display_name,
  p.last_known_rank as rank_guardado,
  (SELECT MIN(l.rank) FROM public.leaderboard l WHERE l.user_id = p.id) as rank_actual,
  CASE 
    WHEN p.last_known_rank IS NULL THEN '⚠️ SIN MEMORIA'
    WHEN p.last_known_rank = (SELECT MIN(l.rank) FROM public.leaderboard l WHERE l.user_id = p.id) THEN '✅ IGUAL'
    ELSE '📊 CAMBIÓ'
  END as estado
FROM public.profiles p
WHERE p.last_known_rank IS NOT NULL
ORDER BY rank_actual
LIMIT 10;

-- 2. Ver tendencias actuales en leaderboard
SELECT 
  entry_id,
  alias,
  rank,
  previous_rank,
  rank_movement,
  CASE 
    WHEN rank_movement > 0 THEN '▲ SUBIÓ ' || rank_movement
    WHEN rank_movement < 0 THEN '▼ BAJÓ ' || ABS(rank_movement)
    WHEN previous_rank IS NULL THEN '— SIN MEMORIA'
    ELSE '— SIN CAMBIO'
  END as tendencia
FROM public.leaderboard
ORDER BY rank
LIMIT 10;

-- 3. Simular actualización de memoria (ejecutar antes de cambiar marcadores)
SELECT public.update_ranking_memory() as usuarios_actualizados;

-- 4. Verificar que se actualizó
SELECT COUNT(*) as usuarios_con_memoria
FROM public.profiles
WHERE last_known_rank IS NOT NULL;
