-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN 077
-- =====================================================
-- Ejecuta estas queries UNA POR UNA para verificar que todo funciona

-- 1. ¿La vista existe?
SELECT COUNT(*) as total_entries_en_leaderboard 
FROM public.leaderboard;

-- 2. ¿Tiene todas las columnas necesarias?
SELECT 
  entry_id,
  alias,
  total_points,
  rank,
  previous_rank,
  rank_movement,
  display_avatar
FROM public.leaderboard
ORDER BY rank
LIMIT 5;

-- 3. ¿La columna last_known_rank existe en profiles?
SELECT 
  id,
  display_name,
  last_known_rank
FROM public.profiles
LIMIT 5;

-- 4. ¿Los permisos están correctos?
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'leaderboard';
