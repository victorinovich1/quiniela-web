-- =====================================================
-- 009 - Multi-jugada: nueva tabla `entries`
-- Cambia predictions y special_predictions de user_id a entry_id
-- =====================================================

drop view if exists public.leaderboard cascade;
drop view if exists public.match_scores cascade;
drop view if exists public.special_scores cascade;
drop view if exists public.teams_in_phase cascade;

-- Tabla entries
create table if not exists public.entries (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, alias)
);

create index if not exists entries_user_id_idx on public.entries(user_id);

alter table public.entries enable row level security;

create policy "entries_read_all" on public.entries for select using (true);
create policy "entries_insert_own_unlocked" on public.entries for insert
  with check (auth.uid() = user_id and not public.predictions_locked());
create policy "entries_update_own_unlocked" on public.entries for update
  using (auth.uid() = user_id and not public.predictions_locked())
  with check (auth.uid() = user_id and not public.predictions_locked());
create policy "entries_delete_own_unlocked" on public.entries for delete
  using (auth.uid() = user_id and not public.predictions_locked());
create policy "entries_admin_all" on public.entries for all
  using (public.is_admin()) with check (public.is_admin());

-- Default entry para usuarios existentes
insert into public.entries (user_id, alias, paid)
select id, coalesce(alias, display_name, split_part(email,'@',1), 'Mi jugada'), paid
from public.profiles
where not exists (select 1 from public.entries e where e.user_id = profiles.id);

-- predictions: agregar entry_id, migrar, cambiar PK
alter table public.predictions add column if not exists entry_id int references public.entries(id) on delete cascade;

update public.predictions p
set entry_id = (select id from public.entries e where e.user_id = p.user_id limit 1)
where p.entry_id is null and p.user_id is not null;

drop policy if exists "predictions_read_after_lock_or_own" on public.predictions;
drop policy if exists "predictions_insert_own_unlocked" on public.predictions;
drop policy if exists "predictions_update_own_unlocked" on public.predictions;
drop policy if exists "predictions_admin" on public.predictions;

alter table public.predictions drop constraint if exists predictions_pkey;
alter table public.predictions drop column if exists user_id;
alter table public.predictions alter column entry_id set not null;
alter table public.predictions add primary key (entry_id, match_id);

create policy "predictions_read" on public.predictions for select
  using (
    exists(select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
    or public.predictions_locked()
    or public.is_admin()
  );
create policy "predictions_insert_own_unlocked" on public.predictions for insert
  with check (
    exists(select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
    and not public.predictions_locked()
  );
create policy "predictions_update_own_unlocked" on public.predictions for update
  using (
    exists(select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
    and not public.predictions_locked()
  )
  with check (
    exists(select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
    and not public.predictions_locked()
  );
create policy "predictions_admin" on public.predictions for all
  using (public.is_admin()) with check (public.is_admin());

-- special_predictions
alter table public.special_predictions add column if not exists entry_id int references public.entries(id) on delete cascade;

update public.special_predictions sp
set entry_id = (select id from public.entries e where e.user_id = sp.user_id limit 1)
where sp.entry_id is null and sp.user_id is not null;

drop policy if exists "specials_read_after_lock_or_own" on public.special_predictions;
drop policy if exists "specials_insert_own_unlocked" on public.special_predictions;
drop policy if exists "specials_update_own_unlocked" on public.special_predictions;
drop policy if exists "specials_admin" on public.special_predictions;

alter table public.special_predictions drop constraint if exists special_predictions_pkey;
alter table public.special_predictions drop column if exists user_id;
alter table public.special_predictions alter column entry_id set not null;
alter table public.special_predictions add primary key (entry_id);

create policy "specials_read" on public.special_predictions for select
  using (
    exists(select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
    or public.predictions_locked()
    or public.is_admin()
  );
create policy "specials_insert_own_unlocked" on public.special_predictions for insert
  with check (
    exists(select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
    and not public.predictions_locked()
  );
create policy "specials_update_own_unlocked" on public.special_predictions for update
  using (
    exists(select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
    and not public.predictions_locked()
  )
  with check (
    exists(select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
    and not public.predictions_locked()
  );
create policy "specials_admin" on public.special_predictions for all
  using (public.is_admin()) with check (public.is_admin());
