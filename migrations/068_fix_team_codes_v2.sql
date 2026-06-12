-- =====================================================
-- 068 - Estandarización de códigos TLA FIFA v4 (batch 2)
-- Corrige discrepancias detectadas en logs de sincronización
-- =====================================================

-- CRÍTICO: Curazao usa CUR en la API de football-data.org v4, no CUW
-- El iso_code (cw) se mantiene igual — las banderas NO se afectan
update public.teams 
set code = 'CUR' 
where name = 'Curazao' and code != 'CUR';

-- REFUERZO: Uruguay debe ser URY (migración 067)
update public.teams 
set code = 'URY' 
where name = 'Uruguay' and code != 'URY';

-- AUDITORÍA DE SEGURIDAD: Verificar códigos FIFA v4 estándar
-- Estos ya deberían estar correctos según migración 008, pero los validamos

-- Corea del Sur debe ser KOR
update public.teams 
set code = 'KOR' 
where name = 'Corea del Sur' and code != 'KOR';

-- Arabia Saudita debe ser KSA
update public.teams 
set code = 'KSA' 
where name = 'Arabia Saudita' and code != 'KSA';

-- Irán debe ser IRN
update public.teams 
set code = 'IRN' 
where name = 'Irán' and code != 'IRN';

-- Países Bajos debe ser NED
update public.teams 
set code = 'NED' 
where name = 'Países Bajos' and code != 'NED';

-- LOG: Confirmar cambios
do $$
begin
  raise notice '✅ Códigos TLA FIFA v4 actualizados:';
  raise notice '   Curazao: CUW → CUR';
  raise notice '   Uruguay: URU → URY (reforzado)';
  raise notice '   (Banderas intactas: iso_code no modificado)';
end $$;
