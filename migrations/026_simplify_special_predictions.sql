-- Migración 026: Simplificar predicciones especiales eliminando categorías subjetivas

-- Recrear view special_scores con solo los 4 puestos del podio
create or replace view public.special_scores as
with s as (select * from public.settings where id = 1)
select
  sp.entry_id,
  ( case when sp.champion_team_id is not null and sp.champion_team_id = s.champion_team_id then s.pt_champion else 0 end
  + case when sp.runner_up_team_id is not null and sp.runner_up_team_id = s.runner_up_team_id then s.pt_runner_up else 0 end
  + case when sp.third_team_id is not null and sp.third_team_id = s.third_team_id then s.pt_third else 0 end
  + case when sp.fourth_team_id is not null and sp.fourth_team_id = s.fourth_team_id then s.pt_fourth else 0 end
  ) as points
from public.special_predictions sp
cross join s
with (security_invoker = true);

grant select on public.special_scores to authenticated, anon;
