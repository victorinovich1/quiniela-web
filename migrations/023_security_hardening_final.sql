-- Migración 023: Limpieza profunda de permisos en funciones SECURITY DEFINER

-- is_admin()
revoke all on function public.is_admin() from public, authenticated, anon;
alter function public.is_admin() set search_path = public;
grant execute on function public.is_admin() to authenticated;

-- is_super_admin()
revoke all on function public.is_super_admin() from public, authenticated, anon;
alter function public.is_super_admin() set search_path = public;
grant execute on function public.is_super_admin() to authenticated;

-- redeem_invite(text)
revoke all on function public.redeem_invite(text) from public, authenticated, anon;
alter function public.redeem_invite(text) set search_path = public;
grant execute on function public.redeem_invite(text) to authenticated;

-- validate_invite(text, text)
revoke all on function public.validate_invite(text, text) from public, authenticated, anon;
alter function public.validate_invite(text, text) set search_path = public;
grant execute on function public.validate_invite(text, text) to anon, authenticated;
