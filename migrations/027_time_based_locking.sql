-- Migración 027: Lógica de tiempos y bloqueo de predicciones

-- 1. Función: ¿se puede pronosticar este partido? (15 min antes del kickoff)
create or replace function public.can_predict_match(p_match_id int)
returns boolean
language sql
stable
as $$
  select kickoff_at is null or kickoff_at > now() + interval '15 minutes'
  from public.matches
  where id = p_match_id;
$$;

-- 2. Función: ¿ya comenzó el mundial? (para bloquear borrado de entries)
create or replace function public.tournament_started()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.matches
    where kickoff_at is not null and kickoff_at <= now()
  );
$$;

-- 3. Actualizar RLS de predictions para usar can_predict_match
drop policy if exists "predictions_insert_own_unlocked" on public.predictions;
drop policy if exists "predictions_update_own_unlocked" on public.predictions;

create policy "predictions_insert_own_before_kickoff" on public.predictions for insert
  with check (
    exists(select 1 from public.entries where id = entry_id and user_id = auth.uid())
    and public.can_predict_match(match_id)
  );

create policy "predictions_update_own_before_kickoff" on public.predictions for update
  using (
    exists(select 1 from public.entries where id = entry_id and user_id = auth.uid())
    and public.can_predict_match(match_id)
  )
  with check (
    exists(select 1 from public.entries where id = entry_id and user_id = auth.uid())
    and public.can_predict_match(match_id)
  );

-- 4. Actualizar RLS de entries para bloquear DELETE si el mundial ya comenzó
drop policy if exists "entries_delete_own_unlocked" on public.entries;

create policy "entries_delete_own_before_tournament" on public.entries for delete
  using (
    auth.uid() = user_id
    and not public.tournament_started()
  );
