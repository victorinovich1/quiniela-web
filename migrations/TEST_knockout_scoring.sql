-- =====================================================
-- TEST - Verificar Puntos en Eliminatorias
-- =====================================================

-- Escenario 1: Usuario predice empate (2-2) + ganador en penales (team A)
-- Resultado real: 3-1 (gana team A en tiempo reglamentario)
-- ANTES: 0 puntos (bug)
-- AHORA: pt_winner_ko puntos ✅

-- Escenario 2: Usuario predice victoria (2-1 team A)
-- Resultado real: 1-1 + penales (gana team A)
-- ANTES: 0 puntos (bug)
-- AHORA: pt_winner_ko puntos ✅

-- Escenario 3: Usuario predice empate (1-1) + ganador penales (team A)
-- Resultado real: 1-1 + penales (gana team A)
-- ANTES: pt_winner_ko ✅
-- AHORA: pt_winner_ko ✅ (sin cambios)

-- Ver configuración actual de puntos
SELECT 
  pt_exact_group,
  pt_exact_ko,
  pt_winner_group,
  pt_winner_ko
FROM public.settings
WHERE id = 1;

-- Revisar partidos de eliminatorias finalizados
SELECT 
  m.match_number,
  m.phase,
  m.home_score || '-' || m.away_score AS resultado,
  CASE 
    WHEN m.home_score > m.away_score THEN 'Local'
    WHEN m.home_score < m.away_score THEN 'Visitante'
    WHEN m.shootout_winner_team_id IS NOT NULL THEN 'Penales'
    ELSE 'Empate'
  END AS tipo_resolucion,
  m.status
FROM public.matches m
WHERE m.phase != 'group' AND m.status = 'finished'
ORDER BY m.match_number
LIMIT 5;

-- Verificar puntos de un partido específico de eliminatorias
-- (reemplaza el match_id con un partido real)
SELECT 
  e.alias,
  p.home_score || '-' || p.away_score AS pronostico,
  CASE 
    WHEN p.ko_winner_team_id IS NOT NULL 
    THEN (SELECT name FROM public.teams WHERE id = p.ko_winner_team_id)
    ELSE 'Sin penales'
  END AS ganador_predicho,
  ms.points
FROM public.match_scores ms
JOIN public.predictions p ON p.entry_id = ms.entry_id AND p.match_id = ms.match_id
JOIN public.entries e ON e.id = ms.entry_id
WHERE ms.match_id = 49 -- Cambiar por un partido real
ORDER BY ms.points DESC, e.alias
LIMIT 10;
