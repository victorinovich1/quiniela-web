-- =====================================================
-- TEST - Simular Actualización de Ranking
-- =====================================================
-- Ejecuta estos comandos para probar el sistema de tendencia

-- 1. Ver estado actual
SELECT 
  entry_id,
  alias,
  rank,
  previous_rank,
  rank_movement,
  CASE 
    WHEN rank_movement > 0 THEN '▲ Subió ' || rank_movement
    WHEN rank_movement < 0 THEN '▼ Bajó ' || ABS(rank_movement)
    ELSE '— Sin cambio'
  END as tendencia
FROM public.leaderboard
ORDER BY rank
LIMIT 10;

-- 2. Ejecutar actualización de memoria
SELECT public.update_ranking_memory() as usuarios_actualizados;

-- 3. Verificar que se guardó
SELECT id, display_name, last_known_rank
FROM public.profiles
WHERE last_known_rank IS NOT NULL
ORDER BY last_known_rank
LIMIT 5;
