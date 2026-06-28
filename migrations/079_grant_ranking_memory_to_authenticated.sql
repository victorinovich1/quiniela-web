-- =====================================================
-- 079 - Permisos de update_ranking_memory para Admin
-- =====================================================
-- Permitir que administradores ejecuten la función desde el cliente

GRANT EXECUTE ON FUNCTION public.update_ranking_memory() TO authenticated;

-- Verificar permisos
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'update_ranking_memory'
ORDER BY grantee;

SELECT 'Permisos de update_ranking_memory actualizados' as status;
