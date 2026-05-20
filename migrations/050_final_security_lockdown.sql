-- =====================================================
-- 050 - Bloqueo de Seguridad Final
-- =====================================================
-- Resuelve todos los avisos del Security Advisor de Supabase:
-- - Search Path Mutable en funciones SECURITY DEFINER
-- - Permisos excesivos en funciones críticas
-- - Exposición de funciones a roles no autorizados
--
-- Todas las funciones críticas quedan blindadas contra:
-- 1. Ataques de path injection (search_path fijo = public)
-- 2. Ejecuciones no autorizadas (REVOKE + GRANT explícito)
-- =====================================================

DO $$
DECLARE
  func_signature TEXT;
BEGIN
  -- =========================================
  -- 1. validate_invite(text, text)
  --    Pre-signup, necesita anon + authenticated
  -- =========================================
  func_signature := 'public.validate_invite(text, text)';
  RAISE NOTICE 'Procesando: %', func_signature;
  
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', func_signature);
  EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', func_signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', func_signature);

  -- =========================================
  -- 2. admin_delete_user(uuid)
  --    Solo authenticated (validado por RLS)
  -- =========================================
  func_signature := 'public.admin_delete_user(uuid)';
  RAISE NOTICE 'Procesando: %', func_signature;
  
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', func_signature);
  EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', func_signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', func_signature);

  -- =========================================
  -- 3. can_predict_match(int)
  --    Solo authenticated
  -- =========================================
  func_signature := 'public.can_predict_match(int)';
  RAISE NOTICE 'Procesando: %', func_signature;
  
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', func_signature);
  EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', func_signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', func_signature);

  -- =========================================
  -- 4. delete_user_self()
  --    Solo authenticated
  -- =========================================
  func_signature := 'public.delete_user_self()';
  RAISE NOTICE 'Procesando: %', func_signature;
  
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', func_signature);
  EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', func_signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', func_signature);

  -- =========================================
  -- 5. is_admin()
  --    Solo authenticated (usada en RLS)
  -- =========================================
  func_signature := 'public.is_admin()';
  RAISE NOTICE 'Procesando: %', func_signature;
  
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', func_signature);
  EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', func_signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', func_signature);

  -- =========================================
  -- 6. is_super_admin()
  --    Solo authenticated (usada en RLS)
  -- =========================================
  func_signature := 'public.is_super_admin()';
  RAISE NOTICE 'Procesando: %', func_signature;
  
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', func_signature);
  EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', func_signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', func_signature);

  -- =========================================
  -- 7. redeem_invite(text)
  --    Solo authenticated (post-login)
  -- =========================================
  func_signature := 'public.redeem_invite(text)';
  RAISE NOTICE 'Procesando: %', func_signature;
  
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', func_signature);
  EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', func_signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', func_signature);

  -- =========================================
  -- 8. tournament_started()
  --    Solo authenticated
  -- =========================================
  func_signature := 'public.tournament_started()';
  RAISE NOTICE 'Procesando: %', func_signature;
  
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', func_signature);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', func_signature);
  EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER SET search_path = public', func_signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', func_signature);

  RAISE NOTICE '✅ Todas las funciones SECURITY DEFINER están blindadas';
END $$;

-- Refrescar estadísticas de la base de datos
ANALYZE;
