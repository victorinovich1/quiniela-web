-- 036_predictions_read_after_kickoff.sql
-- Permite leer pronósticos de otros usuarios para partidos que ya comenzaron

drop policy if exists "predictions_read" on public.predictions;

create policy "predictions_read" on public.predictions for select
  using (
    -- Puede leer sus propias predicciones
    exists(select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
    -- O si el lock global está activo
    or public.predictions_locked()
    -- O si el partido ya comenzó (kickoff_at <= now())
    or exists(
      select 1 from public.matches m 
      where m.id = match_id 
      and m.kickoff_at is not null 
      and m.kickoff_at <= now()
    )
    -- O si es admin
    or public.is_admin()
  );
