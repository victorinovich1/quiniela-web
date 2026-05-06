-- Migración 022: Corregir permisos y search_path de funciones SECURITY DEFINER

-- is_admin(): usada por RLS, necesita authenticated
revoke all on function public.is_admin() from public;
alter function public.is_admin() set search_path = public;
grant execute on function public.is_admin() to authenticated;

-- is_super_admin(): usada por RLS, necesita authenticated
revoke all on function public.is_super_admin() from public;
alter function public.is_super_admin() set search_path = public;
grant execute on function public.is_super_admin() to authenticated;

-- redeem_invite(text): solo para usuarios autenticados
revoke all on function public.redeem_invite(text) from public;
alter function public.redeem_invite(text) set search_path = public;
grant execute on function public.redeem_invite(text) to authenticated;

-- validate_invite(text, text): pre-signup, necesita anon + authenticated
revoke all on function public.validate_invite(text, text) from public;
alter function public.validate_invite(text, text) set search_path = public;
grant execute on function public.validate_invite(text, text) to anon, authenticated;
