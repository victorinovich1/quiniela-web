-- ========================================================================
-- MIGRACIÓN DE EMERGENCIA 066: Desbloquear pronósticos de partidos
-- ========================================================================
-- PROBLEMA: Las políticas RLS de predictions usan predictions_locked() que
--           bloquea TODOS los partidos una vez iniciado el mundial.
-- SOLUCIÓN: Usar can_predict_match(match_id) que verifica individualmente
--           cada partido (15 min antes del kickoff + status='scheduled').
--
-- NOTA: predictions_locked() se mantiene SOLO para:
--       - special_predictions (podio)
--       - entries (borrado)
-- ========================================================================

-- 1. Reemplazar políticas de INSERT y UPDATE en predictions
--    ANTES: usaban predictions_locked() (bloqueo global)
--    AHORA: usan can_predict_match(match_id) (bloqueo individual por partido)

drop policy if exists "predictions_insert_own_unlocked" on public.predictions;
drop policy if exists "predictions_insert_own_before_kickoff" on public.predictions;
drop policy if exists "predictions_update_own_unlocked" on public.predictions;
drop policy if exists "predictions_update_own_before_kickoff" on public.predictions;

create policy "predictions_insert_own_before_kickoff" on public.predictions
  for insert
  with check (
    exists(select 1 from public.entries where id = entry_id and user_id = auth.uid())
    and public.can_predict_match(match_id)
  );

create policy "predictions_update_own_before_kickoff" on public.predictions
  for update
  using (
    exists(select 1 from public.entries where id = entry_id and user_id = auth.uid())
    and public.can_predict_match(match_id)
  )
  with check (
    exists(select 1 from public.entries where id = entry_id and user_id = auth.uid())
    and public.can_predict_match(match_id)
  );

-- 2. Verificar que special_predictions MANTENGA predictions_locked()
--    (El podio SÍ debe bloquearse al inicio del mundial)
--    NO SE MODIFICA - Las políticas actuales están correctas

-- 3. Verificar que entries MANTENGA tournament_started() o predictions_locked()
--    para bloquear borrado después del inicio del mundial
--    NO SE MODIFICA - Las políticas actuales están correctas

-- ========================================================================
-- RESULTADO ESPERADO:
-- - Usuarios pueden pronosticar partidos hasta 15 min antes de cada kickoff
-- - Usuarios NO pueden pronosticar partidos con status != 'scheduled'
-- - Usuarios NO pueden editar el podio después del inicio del mundial
-- - Usuarios NO pueden borrar entries después del inicio del mundial
-- ========================================================================
