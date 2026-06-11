-- =====================================================
-- 065 - Sistema de Mejores Terceros + Etiquetas FIFA Oficiales
-- Incluye view para calcular ranking automático de terceros
-- Actualiza etiquetas de Dieciseisavos según nomenclatura FIFA
-- =====================================================

-- ==========================================
-- PARTE 1: VIEW DE MEJORES TERCEROS
-- ==========================================

-- Drop view si existe
DROP VIEW IF EXISTS best_third_placed_teams CASCADE;

-- Crear view con security_invoker = true para respetar RLS
CREATE OR REPLACE VIEW best_third_placed_teams
WITH (security_invoker = true)
AS
WITH group_standings AS (
  SELECT 
    t.id as team_id,
    t.code,
    t.name,
    t.group_code,
    t.iso_code,
    
    -- Calcular estadísticas de grupo
    COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as matches_played,
    
    -- Puntos (3 por victoria, 1 por empate)
    SUM(
      CASE 
        WHEN m.status = 'finished' AND m.home_team_id = t.id AND m.home_score > m.away_score THEN 3
        WHEN m.status = 'finished' AND m.away_team_id = t.id AND m.away_score > m.home_score THEN 3
        WHEN m.status = 'finished' AND m.home_team_id = t.id AND m.home_score = m.away_score THEN 1
        WHEN m.status = 'finished' AND m.away_team_id = t.id AND m.away_score = m.home_score THEN 1
        ELSE 0
      END
    ) as points,
    
    -- Goles a favor
    SUM(
      CASE 
        WHEN m.status = 'finished' AND m.home_team_id = t.id THEN COALESCE(m.home_score, 0)
        WHEN m.status = 'finished' AND m.away_team_id = t.id THEN COALESCE(m.away_score, 0)
        ELSE 0
      END
    ) as goals_for,
    
    -- Goles en contra
    SUM(
      CASE 
        WHEN m.status = 'finished' AND m.home_team_id = t.id THEN COALESCE(m.away_score, 0)
        WHEN m.status = 'finished' AND m.away_team_id = t.id THEN COALESCE(m.home_score, 0)
        ELSE 0
      END
    ) as goals_against
    
  FROM teams t
  LEFT JOIN matches m ON 
    m.phase = 'group' AND 
    (m.home_team_id = t.id OR m.away_team_id = t.id)
  WHERE t.group_code IS NOT NULL
  GROUP BY t.id, t.code, t.name, t.group_code, t.iso_code
),
group_rankings AS (
  SELECT 
    *,
    (goals_for - goals_against) as goal_difference,
    ROW_NUMBER() OVER (
      PARTITION BY group_code 
      ORDER BY 
        points DESC, 
        (goals_for - goals_against) DESC, 
        goals_for DESC
    ) as group_position
  FROM group_standings
)
SELECT 
  team_id,
  code,
  name,
  group_code,
  iso_code,
  matches_played,
  points,
  goals_for,
  goals_against,
  goal_difference,
  group_position,
  -- Ranking global de terceros (solo los 12 equipos en 3er lugar)
  ROW_NUMBER() OVER (
    ORDER BY 
      points DESC, 
      goal_difference DESC, 
      goals_for DESC,
      name ASC  -- Desempate final alfabético
  ) as third_place_rank
FROM group_rankings
WHERE group_position = 3
ORDER BY third_place_rank ASC;

-- Comentario descriptivo
COMMENT ON VIEW best_third_placed_teams IS 
'Ranking automático de los 12 mejores terceros. Los primeros 8 clasifican a Dieciseisavos. 
Criterios FIFA: 1) Puntos, 2) Diferencia de goles, 3) Goles a favor.';

-- ==========================================
-- PARTE 2: ACTUALIZAR ETIQUETAS DIECISEISAVOS
-- Según nomenclatura oficial FIFA.com
-- ==========================================

-- Actualizar etiquetas de los partidos con terceros
-- Formato simplificado: 3ABC en lugar de 3A/B/C

UPDATE matches SET 
  home_team_label = '1A',
  away_team_label = '3CEFHI'
WHERE match_number = 79;

UPDATE matches SET 
  home_team_label = '1E',
  away_team_label = '3ABCDF'
WHERE match_number = 74;

UPDATE matches SET 
  home_team_label = '1I',
  away_team_label = '3CDFGH'
WHERE match_number = 77;

UPDATE matches SET 
  home_team_label = '1L',
  away_team_label = '3EHIJK'
WHERE match_number = 80;

UPDATE matches SET 
  home_team_label = '1D',
  away_team_label = '3BEFIJ'
WHERE match_number = 81;

UPDATE matches SET 
  home_team_label = '1G',
  away_team_label = '3AEHIJ'
WHERE match_number = 82;

UPDATE matches SET 
  home_team_label = '1B',
  away_team_label = '3EFGIJ'
WHERE match_number = 85;

UPDATE matches SET 
  home_team_label = '1K',
  away_team_label = '3DEIJL'
WHERE match_number = 87;

-- Los demás partidos de Dieciseisavos ya tienen etiquetas correctas
-- M73: 2A vs 2B (correcto)
-- M75: 1F vs 2C (correcto)
-- M76: 1C vs 2F (correcto)
-- M78: 2E vs 2I (correcto)
-- M83: 2K vs 2L (correcto)
-- M84: 1H vs 2J (correcto)
-- M86: 1J vs 2H (correcto)
-- M88: 2D vs 2G (correcto)
