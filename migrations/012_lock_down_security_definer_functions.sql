-- =====================================================
-- 012 - Restringe EXECUTE de funciones SECURITY DEFINER
-- =====================================================

-- handle_new_user: solo trigger interno
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- is_admin: usado en RLS, necesita ser ejecutable por authenticated
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- redeem_invite: solo authenticated (post-login)
revoke execute on function public.redeem_invite(text) from public;
revoke execute on function public.redeem_invite(text) from anon;
grant execute on function public.redeem_invite(text) to authenticated;

-- validate_invite: pre-signup, anon + authenticated
revoke execute on function public.validate_invite(text, text) from public;
grant execute on function public.validate_invite(text, text) to anon;
grant execute on function public.validate_invite(text, text) to authenticated;

-- predictions_locked: util para policies
revoke execute on function public.predictions_locked() from public;
grant execute on function public.predictions_locked() to anon;
grant execute on function public.predictions_locked() to authenticated;

-- touch_updated_at: trigger interno
revoke execute on function public.touch_updated_at() from public;
revoke execute on function public.touch_updated_at() from anon;
revoke execute on function public.touch_updated_at() from authenticated;
