-- =====================================================
-- 006 - Corrige avisos de seguridad
-- - Convierte vistas a security_invoker (respeta RLS del caller)
-- - Fija search_path en funciones
-- =====================================================

alter view public.match_scores set (security_invoker = true);
alter view public.special_scores set (security_invoker = true);
alter view public.teams_in_phase set (security_invoker = true);
alter view public.leaderboard set (security_invoker = true);

alter function public.predictions_locked() set search_path = public;
alter function public.touch_updated_at() set search_path = public;
