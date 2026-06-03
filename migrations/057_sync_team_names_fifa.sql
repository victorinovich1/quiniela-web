-- =====================================================
-- 028 - Sincronizar nombres de equipos con datos FIFA
-- =====================================================

-- Corregir nombres de equipos para coincidir con calendario oficial FIFA
UPDATE public.teams SET name = 'República de Corea' WHERE code = 'KOR';
UPDATE public.teams SET name = 'República Checa' WHERE code = 'CZE';
UPDATE public.teams SET name = 'Bosnia y Herzegovina' WHERE code = 'BIH';
UPDATE public.teams SET name = 'RI de Irán' WHERE code = 'IRN';
UPDATE public.teams SET name = 'Arabia Saudí' WHERE code = 'KSA';
UPDATE public.teams SET name = 'Irak' WHERE code = 'IRQ';
UPDATE public.teams SET name = 'RD Congo' WHERE code = 'COD';
UPDATE public.teams SET name = 'Turquía' WHERE code = 'TUR';

-- Re-vincular matches con equipos actualizados
UPDATE matches m
SET home_team_id = t.id
FROM teams t
WHERE m.phase = 'group'
  AND m.home_team_id IS NULL
  AND m.home_team_label = t.name;

UPDATE matches m
SET away_team_id = t.id
FROM teams t
WHERE m.phase = 'group'
  AND m.away_team_id IS NULL
  AND m.away_team_label = t.name;
