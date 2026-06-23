-- =====================================================
-- 078 - Automatización de Memoria de Ranking
-- =====================================================
-- Función RPC para actualizar last_known_rank tras sincronización

CREATE OR REPLACE FUNCTION public.update_ranking_memory()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Actualizar last_known_rank con el mejor rank actual de cada usuario
  UPDATE public.profiles pr
  SET last_known_rank = subq.best_rank
  FROM (
    SELECT 
      l.user_id,
      MIN(l.rank) as best_rank
    FROM public.leaderboard l
    GROUP BY l.user_id
  ) subq
  WHERE pr.id = subq.user_id
    AND (pr.last_known_rank IS DISTINCT FROM subq.best_rank);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Permisos para service_role (usado por el cron)
GRANT EXECUTE ON FUNCTION public.update_ranking_memory() TO service_role;

SELECT 'Función update_ranking_memory() creada' as status;
