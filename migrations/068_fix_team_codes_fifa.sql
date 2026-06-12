-- =====================================================
-- 068 - Corregir códigos TLA para compatibilidad con API v4
-- =====================================================

-- Corregir códigos TLA para compatibilidad con API v4
UPDATE public.teams SET code = 'URY' WHERE name ILIKE '%Uruguay%';
UPDATE public.teams SET code = 'CUR' WHERE name ILIKE '%Curazao%' OR name ILIKE '%Curaçao%';
UPDATE public.teams SET code = 'NED' WHERE name ILIKE '%Países Bajos%' OR name ILIKE '%Netherlands%';

-- Verificar que iso_code permanezca intacto para las banderas
-- Uruguay: iso_code = 'uy'
-- Curazao: iso_code = 'cw'
-- Países Bajos: iso_code = 'nl'
