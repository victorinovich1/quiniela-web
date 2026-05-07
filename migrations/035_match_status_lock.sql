-- 035_match_status_lock.sql
-- Blindaje: Bloquea pronósticos para partidos que no están en estado 'scheduled'

-- Actualiza can_predict_match para verificar status además del tiempo
create or replace function public.can_predict_match(p_match_id int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select 
    status = 'scheduled' 
    and (kickoff_at is null or kickoff_at > now() + interval '15 minutes')
  from public.matches
  where id = p_match_id;
$$;

-- Mantener permisos mínimos (ya establecidos en migración 034, pero se reaplican por seguridad)
revoke all on function public.can_predict_match(int) from public, anon, authenticated;
grant execute on function public.can_predict_match(int) to authenticated;
