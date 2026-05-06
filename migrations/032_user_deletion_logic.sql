-- =====================================================
-- 032 - Lógica de borrado de usuarios y jugadas
-- =====================================================

-- Función para que un usuario elimine su propia cuenta
-- Solo permitido si el mundial no ha empezado (predictions_locked = false)
create or replace function public.delete_user_self()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  -- Obtener el ID del usuario autenticado
  current_user_id := auth.uid();
  
  if current_user_id is null then
    raise exception 'No hay usuario autenticado';
  end if;
  
  -- Verificar que el mundial no haya empezado
  if public.predictions_locked() then
    raise exception 'No puedes eliminar tu cuenta una vez iniciado el mundial';
  end if;
  
  -- Eliminar el usuario de auth.users (cascada elimina profile, entries, predictions, special_predictions)
  delete from auth.users where id = current_user_id;
end;
$$;

-- Función para que un admin elimine cualquier usuario
create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verificar que el usuario que llama sea admin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden eliminar usuarios';
  end if;
  
  if target_user_id is null then
    raise exception 'ID de usuario requerido';
  end if;
  
  -- Eliminar el usuario de auth.users (cascada elimina todo lo relacionado)
  delete from auth.users where id = target_user_id;
end;
$$;

-- Grant para que usuarios autenticados puedan llamar a delete_user_self
grant execute on function public.delete_user_self() to authenticated;

-- Grant para que usuarios autenticados puedan llamar a admin_delete_user (la función valida internamente que sea admin)
grant execute on function public.admin_delete_user(uuid) to authenticated;
