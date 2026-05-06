-- Migración 025: Extender permisos RLS de invitations para managers

-- Eliminar política restrictiva de super_admin
drop policy if exists "invitations_super_admin_write" on public.invitations;

-- Permitir INSERT, UPDATE, DELETE a admin y manager
create policy "invitations_admin_insert" on public.invitations for insert
  with check (public.is_admin());

create policy "invitations_admin_update" on public.invitations for update
  using (public.is_admin()) with check (public.is_admin());

create policy "invitations_admin_delete" on public.invitations for delete
  using (public.is_admin());
