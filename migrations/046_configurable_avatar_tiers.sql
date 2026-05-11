-- =====================================================
-- 046 - Sistema de avatares por niveles configurables
-- Gamificación: desbloqueo según pts o exactos
-- =====================================================

-- Añadir columnas de requisitos a settings
alter table public.settings
  add column if not exists req_pts_special int default 30,
  add column if not exists req_exact_special int default 3,
  add column if not exists req_pts_premium int default 70,
  add column if not exists req_exact_premium int default 7,
  add column if not exists req_pts_legend int default 120,
  add column if not exists req_exact_legend int default 12;

-- Añadir categoría de avatar a profiles
alter table public.profiles
  add column if not exists avatar_category text default 'permanentes';

-- Recrear view leaderboard con exact_count y avatar_category
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
    -- Conteo de marcadores exactos: contar predicciones con puntos >= pt_exact (mayor que pt_winner)
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
  case
    when avatar_perm_id is not null and avatar_category is not null 
      then '/images/avatars/' || avatar_category || '/' || avatar_perm_id || '.webp'
    when avatar_perm_id is not null 
      then '/images/avatars/permanentes/' || avatar_perm_id || '.webp'
    else '/images/avatars/default.webp'
  end as display_avatar
from ranked_entries
order by total_points desc;

-- Restaurar permisos
grant select on public.leaderboard to authenticated, anon;

-- Inicializar valores default en settings si no existen
update public.settings
set 
  req_pts_special = coalesce(req_pts_special, 30),
  req_exact_special = coalesce(req_exact_special, 3),
  req_pts_premium = coalesce(req_pts_premium, 70),
  req_exact_premium = coalesce(req_exact_premium, 7),
  req_pts_legend = coalesce(req_pts_legend, 120),
  req_exact_legend = coalesce(req_exact_legend, 12)
where id = 1;

select 'Sistema de niveles de avatares configurado' as status;
