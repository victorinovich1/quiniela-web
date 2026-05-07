-- 036_allow_read_started_predictions.sql
-- Permite leer pronósticos de otros usuarios para partidos que ya comenzaron
-- Esto es esencial para la "Zona de Acción en Vivo" del Ranking

drop policy if exists "predictions_read" on public.predictions;

create policy "predictions_read" on public.predictions for select
  using (
    -- 1. Puede leer sus propias predicciones siempre
    exists(select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
    -- 2. O si el lock global está activo (después del inicio del mundial)
    or public.predictions_locked()
    -- 3. O si el partido ya comenzó (now() >= kickoff_at)
    or exists(
      select 1 from public.matches m 
      where m.id = match_id 
      and m.kickoff_at is not null 
      and now() >= m.kickoff_at
    )
    -- 4. O si es admin/manager
    or public.is_admin()
  );
