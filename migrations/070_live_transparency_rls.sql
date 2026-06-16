-- =====================================================
-- 070 - Transparencia en vivo: Ver pronósticos de rivales
-- =====================================================

-- ===== PREDICTIONS: Lectura permitida si es tuyo o el partido empezó =====

-- Eliminar política antigua de lectura
drop policy if exists "predictions_read_after_lock_or_own" on public.predictions;
drop policy if exists "predictions_read_own_or_live" on public.predictions;

-- Nueva política: permite SELECT si:
-- A) Es mi propia quiniela (entry_id pertenece a mi user_id)
-- B) O el partido está 'live' o 'finished'
create policy "predictions_read_own_or_live" on public.predictions
for select
using (
  auth.uid() = (select user_id from public.entries where id = entry_id)
  or
  (select status from public.matches where id = match_id) in ('live', 'finished')
  or
  public.is_admin()
);

-- ===== SPECIAL_PREDICTIONS: Lectura tras lock_at =====

-- Eliminar políticas antiguas
drop policy if exists "specials_read_after_lock_or_own" on public.special_predictions;
drop policy if exists "specials_read_after_mundial_start" on public.special_predictions;

-- Nueva política: permite SELECT si:
-- A) Es mi propia predicción especial
-- B) O ya pasó la fecha de lock (lock_at del mundial)
create policy "specials_read_after_mundial_start" on public.special_predictions
for select
using (
  auth.uid() = (select user_id from public.entries where id = entry_id)
  or
  now() > (select lock_at from public.settings where id = 1)
  or
  public.is_admin()
);

-- LOG: Confirmar cambios
do $$
begin
  raise notice '✅ Transparencia en vivo activada:';
  raise notice '   - Predictions: visibles cuando partido empieza';
  raise notice '   - Special Predictions: visibles tras lock_at';
end $$;
