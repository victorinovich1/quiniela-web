-- =====================================================
-- 002 - Row Level Security + funciones helper
-- =====================================================

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.invitations enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.special_predictions enable row level security;

-- Helper: ¿es admin el usuario actual?
create or replace function public.is_admin()
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

-- Helper: ¿están bloqueados los pronósticos?
create or replace function public.predictions_locked()
returns boolean
language sql
stable
as $$
  select coalesce(
    (select lock_at < now() from public.settings where id = 1),
    false
  );
$$;

-- ----- profiles -----
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_admin_update" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());
create policy "profiles_admin_delete" on public.profiles for delete
  using (public.is_admin());

-- ----- settings -----
create policy "settings_read_all" on public.settings for select using (true);
create policy "settings_admin_update" on public.settings for update
  using (public.is_admin()) with check (public.is_admin());

-- ----- invitations -----
create policy "invitations_admin_all" on public.invitations for all
  using (public.is_admin()) with check (public.is_admin());

-- ----- teams -----
create policy "teams_read_all" on public.teams for select using (true);
create policy "teams_admin_write" on public.teams for all
  using (public.is_admin()) with check (public.is_admin());

-- ----- matches -----
create policy "matches_read_all" on public.matches for select using (true);
create policy "matches_admin_write" on public.matches for all
  using (public.is_admin()) with check (public.is_admin());

-- ----- predictions (versión inicial — luego migración 009 cambia a entry_id) -----
create policy "predictions_read_after_lock_or_own" on public.predictions for select
  using (auth.uid() = user_id or public.predictions_locked() or public.is_admin());

create policy "predictions_insert_own_unlocked" on public.predictions for insert
  with check (auth.uid() = user_id and not public.predictions_locked());

create policy "predictions_update_own_unlocked" on public.predictions for update
  using (auth.uid() = user_id and not public.predictions_locked())
  with check (auth.uid() = user_id and not public.predictions_locked());

create policy "predictions_admin" on public.predictions for all
  using (public.is_admin()) with check (public.is_admin());

-- ----- special_predictions (versión inicial) -----
create policy "specials_read_after_lock_or_own" on public.special_predictions for select
  using (auth.uid() = user_id or public.predictions_locked() or public.is_admin());

create policy "specials_insert_own_unlocked" on public.special_predictions for insert
  with check (auth.uid() = user_id and not public.predictions_locked());

create policy "specials_update_own_unlocked" on public.special_predictions for update
  using (auth.uid() = user_id and not public.predictions_locked())
  with check (auth.uid() = user_id and not public.predictions_locked());

create policy "specials_admin" on public.special_predictions for all
  using (public.is_admin()) with check (public.is_admin());
