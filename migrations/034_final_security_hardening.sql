-- 034_final_security_hardening.sql
-- Corrige avisos del Security Advisor: Search Path Mutable + permisos mínimos

-- =========================================
-- 1. can_predict_match(int)
-- =========================================
REVOKE ALL ON FUNCTION public.can_predict_match(int) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.can_predict_match(int) SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.can_predict_match(int) TO authenticated;

-- =========================================
-- 2. tournament_started()
-- =========================================
REVOKE ALL ON FUNCTION public.tournament_started() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.tournament_started() SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.tournament_started() TO authenticated;

-- =========================================
-- 3. admin_delete_user(uuid)
-- =========================================
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.admin_delete_user(uuid) SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- =========================================
-- 4. delete_user_self()
-- =========================================
REVOKE ALL ON FUNCTION public.delete_user_self() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.delete_user_self() SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.delete_user_self() TO authenticated;

-- =========================================
-- 5. validate_invite(text, text)
-- =========================================
REVOKE ALL ON FUNCTION public.validate_invite(text, text) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.validate_invite(text, text) SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.validate_invite(text, text) TO anon, authenticated;

-- =========================================
-- 6. is_admin()
-- =========================================
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.is_admin() SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =========================================
-- 7. is_super_admin()
-- =========================================
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.is_super_admin() SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- =========================================
-- 8. redeem_invite(text)
-- =========================================
REVOKE ALL ON FUNCTION public.redeem_invite(text) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.redeem_invite(text) SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.redeem_invite(text) TO authenticated;
