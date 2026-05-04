-- =====================================================
-- 018 - Bloqueo de eliminación de entries al inicio del torneo
-- Una vez que comienza el primer partido, los participantes
-- no pueden borrar sus jugadas (entries).
-- Los admins conservan permiso total para borrar.
-- =====================================================

-- Eliminar política de DELETE existente para usuarios autenticados
drop policy if exists "Users can delete own entries" on public.entries;

-- Nueva política: el usuario puede borrar su propia entry
-- SOLO antes de que inicie el primer partido del torneo
create policy "Users can delete own entries before tournament starts"
  on public.entries
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    and now() < coalesce(
      (select min(kickoff_at) from public.matches where kickoff_at is not null),
      'infinity'::timestamptz
    )
  );

-- Política separada: admin puede borrar cualquier entry en cualquier momento
drop policy if exists "Admins can delete any entry" on public.entries;

create policy "Admins can delete any entry"
  on public.entries
  for delete
  to authenticated
  using (is_admin());
