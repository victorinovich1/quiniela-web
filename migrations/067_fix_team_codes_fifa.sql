-- =====================================================
-- 067 - Estandarización de códigos FIFA
-- Corrige códigos de equipos para coincidir con API v4
-- =====================================================

-- CRÍTICO: Uruguay usa URY en la API de football-data.org v4, no URU
-- El iso_code (uy) se mantiene igual — las banderas no se afectan
update public.teams 
set code = 'URY' 
where name = 'Uruguay' and code = 'URU';

-- AUDITORÍA PREVENTIVA: Confirmar que otros códigos comunes estén correctos
-- Estos ya están bien según migración 008, pero lo verificamos por si hubo ediciones manuales

-- Arabia Saudita debe ser KSA (ya está correcto)
update public.teams 
set code = 'KSA' 
where name = 'Arabia Saudita' and code != 'KSA';

-- Corea del Sur debe ser KOR (ya está correcto)
update public.teams 
set code = 'KOR' 
where name = 'Corea del Sur' and code != 'KOR';

-- Irán debe ser IRN (ya está correcto)
update public.teams 
set code = 'IRN' 
where name = 'Irán' and code != 'IRN';

-- LOG: Confirmar cambios
do $$
begin
  raise notice '✅ Códigos FIFA actualizados:';
  raise notice '   Uruguay: URU → URY';
  raise notice '   (Banderas no afectadas: iso_code se mantiene igual)';
end $$;
