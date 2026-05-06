-- Migración 020: Agregar rol 'manager' con permisos restringidos
-- Managers pueden acceder a /admin pero solo ver Invitaciones y Participantes

-- 1. Actualizar is_admin() para incluir 'manager' (acceso a ruta /admin)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager')
  );
$$;

-- 2. Crear is_super_admin() solo para 'admin' (permisos completos)
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Actualizar RLS de invitations: managers pueden ver (SELECT) pero no modificar
drop policy if exists "invitations_admin_all" on public.invitations;

create policy "invitations_admin_select" on public.invitations for select
  using (public.is_admin());

create policy "invitations_super_admin_write" on public.invitations for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- 4. Actualizar RLS de profiles: managers pueden ver pero solo super_admin puede modificar roles
drop policy if exists "profiles_admin_update" on public.profiles;
drop policy if exists "profiles_admin_delete" on public.profiles;

create policy "profiles_super_admin_update" on public.profiles for update
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "profiles_super_admin_delete" on public.profiles for delete
  using (public.is_super_admin());

-- 5. Actualizar otras tablas críticas: solo super_admin puede escribir
drop policy if exists "settings_admin_update" on public.settings;
drop policy if exists "teams_admin_write" on public.teams;
drop policy if exists "matches_admin_write" on public.matches;
drop policy if exists "predictions_admin" on public.predictions;
drop policy if exists "specials_admin" on public.special_predictions;

create policy "settings_super_admin_update" on public.settings for update
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "teams_super_admin_write" on public.teams for all
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "matches_super_admin_write" on public.matches for all
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "predictions_super_admin" on public.predictions for all
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "specials_super_admin" on public.special_predictions for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- 6. Actualizar entries: solo super_admin puede escribir (migración 009 creó policies)
drop policy if exists "entries_admin_all" on public.entries;

create policy "entries_super_admin_all" on public.entries for all
  using (public.is_super_admin()) with check (public.is_super_admin());
