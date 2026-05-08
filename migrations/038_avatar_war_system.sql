-- =====================================================
-- 038 - Sistema de Trono y Castigo (Avatar War)
-- El #1 del ranking puede "castigar" a otros usuarios con avatares de broma
-- =====================================================

-- 1. PREPARACIÓN: Añadir columnas a profiles
alter table public.profiles
  add column if not exists avatar_perm_id int,
  add column if not exists avatar_temp_id int;

-- 1.1 LIMPIEZA PREVENTIVA: Asegurar que no hay duplicados antes del UNIQUE constraint
update public.profiles set avatar_perm_id = null;
update public.profiles set avatar_temp_id = null;

-- 1.2 UNIQUE CONSTRAINT: Cada avatar permanente solo puede usarlo un usuario
drop index if exists profiles_avatar_perm_id_unique;
create unique index profiles_avatar_perm_id_unique 
  on public.profiles(avatar_perm_id) 
  where avatar_perm_id is not null;

-- 2. TRIGGER: Limpiar castigos cuando un partido cambia a 'live'
create or replace function public.clear_temporary_avatars()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Solo ejecutar cuando status cambia de 'scheduled' a 'live'
  if (old.status = 'scheduled' and new.status = 'live') then
    update public.profiles set avatar_temp_id = null;
    raise notice 'Avatar punishments cleared - match % went live', new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists clear_punishments_on_match_live on public.matches;

create trigger clear_punishments_on_match_live
  after update on public.matches
  for each row
  when (old.status = 'scheduled' and new.status = 'live')
  execute function public.clear_temporary_avatars();

-- 3. VIEW: Actualizar leaderboard con display_avatar
drop view if exists public.leaderboard cascade;

create or replace view public.leaderboard
with (security_invoker = true)
as
with ranked_entries as (
  select
    e.id as entry_id,
    e.user_id,
    e.alias,
    e.paid,
    pr.display_name,
    pr.avatar_perm_id,
    pr.avatar_temp_id,
    coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0) as match_points,
    coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as special_points,
    coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0)
    + coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as total_points,
    row_number() over (order by 
      coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0)
      + coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) desc
    ) as rank
  from public.entries e
  join public.profiles pr on pr.id = e.user_id
)
select
  entry_id,
  user_id,
  display_name,
  alias,
  paid,
  avatar_perm_id,
  avatar_temp_id,
  match_points,
  special_points,
  total_points,
  rank,
  case
    when rank = 1 then '/images/avatars/0.png'
    when avatar_temp_id is not null then '/images/avatars/bromas/' || avatar_temp_id || '.png'
    when avatar_perm_id is not null then '/images/avatars/permanentes/' || avatar_perm_id || '.png'
    else '/images/avatars/default.png'
  end as display_avatar
from ranked_entries
order by total_points desc;

-- 4. PERMISOS: Grant para función y columnas
grant execute on function public.clear_temporary_avatars() to authenticated;
grant update (avatar_perm_id, avatar_temp_id) on public.profiles to authenticated;

select 'Sistema de Trono y Castigo instalado exitosamente' as status;
