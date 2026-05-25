-- Migración 052: Sistema de Historial de Notificaciones
-- Descripción: batch_id para agrupar envíos, funciones de limpieza admin

-- ============================================================================
-- 1. COLUMNA BATCH_ID EN NOTIFICATIONS
-- ============================================================================
-- Permite agrupar todas las notificaciones enviadas en un mismo lote (envío masivo)
alter table notifications
  add column if not exists batch_id uuid default null;

-- Índice para queries por lote
create index if not exists idx_notifications_batch_id on notifications(batch_id) where batch_id is not null;

-- ============================================================================
-- 2. FUNCIÓN: Eliminar Lote Completo (Solo Admin)
-- ============================================================================
create or replace function admin_delete_notification_batch(p_batch_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verificar que el usuario actual es admin
  if not exists (
    select 1 from profiles 
    where id = auth.uid() and role in ('admin', 'manager')
  ) then
    raise exception 'Solo administradores pueden eliminar lotes de notificaciones';
  end if;

  -- Eliminar todas las notificaciones con ese batch_id
  delete from notifications where batch_id = p_batch_id;
end;
$$;

comment on function admin_delete_notification_batch(uuid) is 
  'Elimina todas las notificaciones de un lote específico. Solo admin/manager.';

-- ============================================================================
-- 3. FUNCIÓN: Vaciar Todas las Notificaciones del Sistema (Solo Admin)
-- ============================================================================
create or replace function admin_clear_all_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verificar que el usuario actual es admin
  if not exists (
    select 1 from profiles 
    where id = auth.uid() and role in ('admin', 'manager')
  ) then
    raise exception 'Solo administradores pueden vaciar el sistema de notificaciones';
  end if;

  -- Eliminar TODAS las notificaciones
  delete from notifications;
end;
$$;

comment on function admin_clear_all_notifications() is 
  'Elimina TODAS las notificaciones del sistema. Solo admin/manager. Usar con precaución.';

-- ============================================================================
-- 4. POLÍTICAS RLS ACTUALIZADAS
-- ============================================================================
-- Las políticas existentes de 051 ya cubren SELECT/UPDATE/DELETE para usuarios
-- No necesitamos cambios adicionales aquí, pero aseguramos que existan:

-- SELECT: Usuario puede ver sus propias notificaciones
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'notifications' and policyname = 'Users can view own notifications'
  ) then
    create policy "Users can view own notifications"
      on notifications for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- UPDATE: Usuario puede actualizar sus propias notificaciones (marcar como leído)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'notifications' and policyname = 'Users can update own notifications'
  ) then
    create policy "Users can update own notifications"
      on notifications for update
      using (auth.uid() = user_id);
  end if;
end $$;

-- DELETE: Usuario puede eliminar sus propias notificaciones
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'notifications' and policyname = 'Users can delete own notifications'
  ) then
    create policy "Users can delete own notifications"
      on notifications for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- INSERT: Service role puede insertar (desde funciones SECURITY DEFINER)
-- Esta política ya debería existir de la migración 051
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'notifications' and policyname = 'Service can insert notifications'
  ) then
    create policy "Service can insert notifications"
      on notifications for insert
      with check (true);
  end if;
end $$;
