-- =====================================================
-- 080 - RESTAURAR RANKING + CORREGIR SCORING KO
-- =====================================================
-- Arregla 2 bugs críticos:
-- 1. Ranking caído por falta de columna last_known_rank y vista leaderboard
-- 2. Scoring injusto en eliminatorias (no premiaba empate + ganador correcto)

-- PASO 1: Preparar columna de tendencia
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_known_rank INTEGER DEFAULT NULL;

-- PASO 2: Recrear scoring de partidos con lógica corregida
DROP VIEW IF EXISTS public.leaderboard CASCADE;
DROP VIEW IF EXISTS public.match_scores CASCADE;

CREATE OR REPLACE VIEW public.match_scores
WITH (security_invoker = true)
AS
WITH cfg AS (
  SELECT pt_exact_group, pt_exact_ko, pt_winner_group, pt_winner_ko 
  FROM public.settings 
  WHERE id = 1
),
real_winner AS (
  SELECT 
    m.id AS match_id,
    CASE
      WHEN m.status <> 'finished' THEN NULL
      WHEN m.home_score > m.away_score THEN m.home_team_id
      WHEN m.home_score < m.away_score THEN m.away_team_id
      ELSE m.shootout_winner_team_id
    END AS winner_team_id,
    m.phase, 
    m.home_score, 
    m.away_score, 
    m.home_team_id, 
    m.away_team_id
  FROM public.matches m
)
SELECT
  p.entry_id,
  p.match_id,
  rw.phase,
  CASE
    -- Sin datos: 0 puntos
    WHEN rw.home_score IS NULL OR rw.away_score IS NULL THEN 0
    WHEN p.home_score IS NULL OR p.away_score IS NULL THEN 0
    
    -- Marcador exacto: puntos completos
    WHEN p.home_score = rw.home_score AND p.away_score = rw.away_score THEN
      CASE WHEN rw.phase = 'group' THEN (SELECT pt_exact_group FROM cfg)
           ELSE (SELECT pt_exact_ko FROM cfg) END
    
    -- Fase de grupos: acertó tendencia (ganador por diferencia de goles)
    WHEN rw.phase = 'group' 
         AND SIGN(p.home_score - p.away_score) = SIGN(rw.home_score - rw.away_score) THEN
      (SELECT pt_winner_group FROM cfg)
    
    -- Fase eliminatoria: acertó quién avanza (winner_team_id)
    WHEN rw.phase <> 'group' AND rw.winner_team_id IS NOT NULL THEN
      CASE
        -- Usuario predijo victoria local
        WHEN p.home_score > p.away_score THEN
          CASE WHEN rw.winner_team_id = rw.home_team_id 
               THEN (SELECT pt_winner_ko FROM cfg) 
               ELSE 0 END
        
        -- Usuario predijo victoria visitante
        WHEN p.home_score < p.away_score THEN
          CASE WHEN rw.winner_team_id = rw.away_team_id 
               THEN (SELECT pt_winner_ko FROM cfg) 
               ELSE 0 END
        
        -- Usuario predijo empate + ganador de penales
        WHEN p.home_score = p.away_score AND p.ko_winner_team_id IS NOT NULL THEN
          CASE WHEN rw.winner_team_id = p.ko_winner_team_id 
               THEN (SELECT pt_winner_ko FROM cfg) 
               ELSE 0 END
        
        ELSE 0
      END
    
    ELSE 0
  END AS points
FROM public.predictions p
JOIN real_winner rw ON rw.match_id = p.match_id;

GRANT SELECT ON public.match_scores TO authenticated, anon;

-- PASO 3: Recrear vista Leaderboard con tendencias
CREATE OR REPLACE VIEW public.leaderboard 
WITH (security_invoker = true)
AS
WITH ranked_entries AS (
  SELECT
    e.id AS entry_id,
    e.user_id,
    e.alias,
    e.paid,
    pr.display_name,
    pr.avatar_perm_id,
    pr.avatar_category,
    pr.country_code,
    pr.last_known_rank,
    CASE 
      WHEN pr.avatar_perm_id IS NULL THEN '/images/avatars/default.webp'
      ELSE '/images/avatars/' || COALESCE(pr.avatar_category, 'permanentes') || '/' || pr.avatar_perm_id || '.webp'
    END AS display_avatar,
    COALESCE((SELECT sum(points) FROM public.match_scores ms WHERE ms.entry_id = e.id), 0) AS match_points,
    COALESCE((SELECT points FROM public.special_scores ss WHERE ss.entry_id = e.id), 0) AS special_points,
    COALESCE((SELECT sum(points) FROM public.match_scores ms WHERE ms.entry_id = e.id), 0)
      + COALESCE((SELECT points FROM public.special_scores ss WHERE ss.entry_id = e.id), 0) AS total_points,
    COALESCE((
      SELECT count(*)
      FROM public.match_scores ms
      JOIN public.matches m ON m.id = ms.match_id
      JOIN public.settings s ON true
      WHERE ms.entry_id = e.id
        AND ms.points >= (CASE WHEN m.phase = 'group' THEN s.pt_exact_group ELSE s.pt_exact_ko END)
    ), 0) AS total_exact,
    COALESCE((
      SELECT count(*)
      FROM public.match_scores ms
      JOIN public.matches m ON m.id = ms.match_id
      WHERE ms.entry_id = e.id AND m.phase != 'group' AND ms.points > 0
    ), 0) AS ko_winner_count,
    COALESCE((
      SELECT count(*)
      FROM public.match_scores ms
      JOIN public.matches m ON m.id = ms.match_id
      JOIN public.settings s ON true
      WHERE ms.entry_id = e.id AND m.phase != 'group' AND ms.points >= s.pt_exact_ko
    ), 0) AS ko_exact_count,
    COALESCE((
      SELECT sum(ms.points)
      FROM public.match_scores ms
      JOIN public.matches m ON m.id = ms.match_id
      WHERE ms.entry_id = e.id AND m.phase != 'group'
    ), 0) AS ko_points,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.special_predictions sp
        JOIN public.settings s ON true
        WHERE sp.entry_id = e.id
          AND sp.champion_team_id IS NOT NULL
          AND s.champion_team_id IS NOT NULL
          AND sp.champion_team_id = s.champion_team_id
      ) THEN 1
      ELSE 0
    END AS correct_champion,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.special_predictions sp
        JOIN public.settings s ON true
        WHERE sp.entry_id = e.id
          AND sp.runner_up_team_id IS NOT NULL
          AND s.runner_up_team_id IS NOT NULL
          AND sp.runner_up_team_id = s.runner_up_team_id
      ) THEN 1
      ELSE 0
    END AS correct_runner_up,
    e.created_at
  FROM public.entries e
  JOIN public.profiles pr ON pr.id = e.user_id
)
SELECT
  entry_id,
  user_id,
  display_name,
  alias,
  paid,
  avatar_perm_id,
  avatar_category,
  country_code,
  match_points,
  special_points,
  total_points,
  total_exact,
  ko_winner_count,
  ko_exact_count,
  ko_points,
  correct_champion,
  correct_runner_up,
  ROW_NUMBER() OVER (
    ORDER BY total_points DESC, total_exact DESC, ko_winner_count DESC, created_at ASC
  ) AS rank,
  last_known_rank AS previous_rank,
  CASE 
    WHEN last_known_rank IS NULL THEN 0
    ELSE last_known_rank - ROW_NUMBER() OVER (
      ORDER BY total_points DESC, total_exact DESC, ko_winner_count DESC, created_at ASC
    )
  END AS rank_movement,
  display_avatar
FROM ranked_entries;

GRANT SELECT ON public.leaderboard TO authenticated, anon;

-- PASO 4: Función para capturar snapshot del ranking antes de actualizar resultados
CREATE OR REPLACE FUNCTION public.update_ranking_memory()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
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

GRANT EXECUTE ON FUNCTION public.update_ranking_memory() TO service_role, authenticated;

SELECT '✅ Ranking restaurado + Scoring KO corregido' AS status;
