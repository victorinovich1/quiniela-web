-- =====================================================
-- 047 - Arreglar unicidad de avatares por categoría
-- Permite que diferentes categorías usen el mismo ID
-- =====================================================

-- 1. Eliminar el constraint único que solo verifica avatar_perm_id
drop index if exists public.profiles_avatar_perm_id_unique;

-- 2. Crear constraint único sobre el par (avatar_category, avatar_perm_id)
-- Esto permite que el ID 1 de 'especiales' sea distinto al ID 1 de 'permanentes'
create unique index profiles_avatar_category_id_unique 
  on public.profiles(avatar_category, avatar_perm_id) 
  where avatar_perm_id is not null;

-- 3. Verificar que la view leaderboard construya la ruta dinámicamente
-- (Ya implementado en migración 046, pero lo recreamos por si acaso)
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
    pr.avatar_category,
    pr.country_code,
    coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0) as match_points,
    coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as special_points,
    coalesce((select sum(points) from public.match_scores ms where ms.entry_id = e.id), 0)
    + coalesce((select points from public.special_scores ss where ss.entry_id = e.id), 0) as total_points,
    coalesce((
      select count(*)
      from public.match_scores ms
      join public.matches m on m.id = ms.match_id
      join public.settings s on true
      where ms.entry_id = e.id
        and ms.points >= (case when m.phase = 'group' then s.pt_exact_group else s.pt_exact_ko end)
    ), 0) as exact_count,
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
  avatar_category,
  country_code,
  match_points,
  special_points,
  total_points,
  exact_count,
  rank,
  -- Construcción DINÁMICA de la ruta usando avatar_category
  case
    when avatar_perm_id is null then '/images/avatars/default.webp'
    else '/images/avatars/' || coalesce(avatar_category, 'permanentes') || '/' || avatar_perm_id || '.webp'
  end as display_avatar
from ranked_entries
order by total_points desc;

grant select on public.leaderboard to authenticated, anon;

select 'Unicidad de avatares corregida: ahora por (categoría, ID)' as status;
