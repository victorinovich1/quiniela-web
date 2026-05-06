-- Sistema de bloqueo dual: global + por partido
-- Bloqueo global (lock_at) afecta: podio especial y borrado de entries
-- Bloqueo por partido (kickoff_at - 15 min) afecta: marcadores individuales

-- 1. Special predictions: bloquear UPDATE después de lock_at
drop policy if exists "special_predictions_update" on public.special_predictions;
create policy "special_predictions_update"
  on public.special_predictions for update
  using (auth.uid() = (select user_id from public.entries where id = entry_id))
  with check (
    auth.uid() = (select user_id from public.entries where id = entry_id)
    and not public.predictions_locked()
  );

-- 2. Entries: bloquear DELETE después de lock_at
drop policy if exists "entries_delete" on public.entries;
create policy "entries_delete"
  on public.entries for delete
  using (
    auth.uid() = user_id
    and not public.predictions_locked()
  );

comment on policy "special_predictions_update" on public.special_predictions is 
  'Bloqueo global: no permite modificar podio después de lock_at';
comment on policy "entries_delete" on public.entries is 
  'Bloqueo global: no permite borrar entries después de lock_at';
