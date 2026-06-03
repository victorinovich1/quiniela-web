-- Migration 063: Fix Manager Invitation Rights
-- Permite que tanto Admin como Manager gestionen invitaciones desde la web

-- Crear función helper para verificar roles admin o manager
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
  );
$$;

-- Comentario de la función
COMMENT ON FUNCTION public.is_manager_or_admin() IS 
'Verifica si el usuario autenticado tiene rol admin o manager. Usado en RLS policies.';

-- Actualizar política INSERT de invitations
DROP POLICY IF EXISTS "Admin puede crear invitaciones" ON public.invitations;

CREATE POLICY "Admin y Manager pueden crear invitaciones"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (public.is_manager_or_admin());

-- Actualizar política DELETE de invitations
DROP POLICY IF EXISTS "Admin puede eliminar invitaciones" ON public.invitations;

CREATE POLICY "Admin y Manager pueden eliminar invitaciones"
ON public.invitations
FOR DELETE
TO authenticated
USING (public.is_manager_or_admin());

-- Actualizar política UPDATE de invitations (si existe)
DROP POLICY IF EXISTS "Admin puede actualizar invitaciones" ON public.invitations;

CREATE POLICY "Admin y Manager pueden actualizar invitaciones"
ON public.invitations
FOR UPDATE
TO authenticated
USING (public.is_manager_or_admin())
WITH CHECK (public.is_manager_or_admin());

-- Verificación de seguridad
-- Esta migración NO rompe la seguridad porque:
-- 1. Solo usuarios autenticados con rol 'admin' o 'manager' pueden gestionar invitaciones
-- 2. La función is_manager_or_admin() usa SECURITY DEFINER pero solo lee la tabla profiles
-- 3. Los participantes normales (rol 'participant') siguen sin poder crear/editar/borrar invitaciones
-- 4. El acceso anónimo sigue bloqueado (política TO authenticated)
