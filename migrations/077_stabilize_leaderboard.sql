-- =====================================================
-- 077 - ESTABILIZACIÓN DE EMERGENCIA DEL RANKING
-- =====================================================
-- Migración única para restaurar el sistema de leaderboard

-- A. Limpiar vistas y tablas fallidas
DROP VIEW IF EXISTS public.leaderboard CASCADE;
DROP TABLE IF EXISTS public.ranking_snapshots CASCADE;

-- B. Asegurar columna de tendencia en la tabla real
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_known_rank INTEGER DEFAULT NULL;

-- C. Recrear Vista Leaderboard (Versión Ultra-Estable)
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
    -- Ruta de avatar consistente
    CASE 
      WHEN pr.avatar_perm_id IS NULL THEN '/images/avatars/default.webp'
      ELSE '/images/avatars/' || COALESCE(pr.avatar_category, 'permanentes') || '/' || pr.avatar_perm_id || '.webp'
    END AS display_avatar,
    -- Puntos
    COALESCE((SELECT sum(points) FROM public.match_scores ms WHERE ms.entry_id = e.id), 0) AS match_points,
    COALESCE((SELECT points FROM public.special_scores ss WHERE ss.entry_id = e.id), 0) AS special_points,
    COALESCE((SELECT sum(points) FROM public.match_scores ms WHERE ms.entry_id = e.id), 0)
      + COALESCE((SELECT points FROM public.special_scores ss WHERE ss.entry_id = e.id), 0) AS total_points,
    -- Criterios de desempate (simplificados por ahora)
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

-- D. Restaurar Permisos
GRANT SELECT ON public.leaderboard TO authenticated, anon;

SELECT 'Leaderboard estabilizado correctamente' AS status;
