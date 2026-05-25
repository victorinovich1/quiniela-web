-- Migración 053: Fix acceso admin al historial de notificaciones
-- Descripción: Añade batch_id y policy de admin para ver todas las notifications

-- ============================================================================
-- 1. COLUMNA BATCH_ID (si no existe)
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'notifications' 
    and column_name = 'batch_id'
  ) then
    alter table notifications add column batch_id uuid default null;
    create index idx_notifications_batch_id on notifications(batch_id) where batch_id is not null;
  end if;
end $$;

-- ============================================================================
-- 2. RLS POLICY: Admin puede ver TODAS las notificaciones
-- ============================================================================
do $$
begin
  -- Drop policy si existe (para permitir recreación)
  drop policy if exists "Admins can view all notifications" on notifications;
  
  -- Crear policy de admin
  create policy "Admins can view all notifications"
    on notifications
    for select
    using (
      exists (
        select 1 from profiles 
        where id = auth.uid() 
        and role in ('admin', 'manager')
      )
    );
end $$;

-- ============================================================================
-- 3. FUNCIONES DE LIMPIEZA (si no existen)
-- ============================================================================

-- Función: Eliminar lote completo
create or replace function admin_delete_notification_batch(p_batch_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from profiles 
    where id = auth.uid() and role in ('admin', 'manager')
  ) then
    raise exception 'Solo administradores pueden eliminar lotes';
  end if;

  delete from notifications where batch_id = p_batch_id;
end;
$$;

-- Función: Vaciar todas las notificaciones
create or replace function admin_clear_all_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from profiles 
    where id = auth.uid() and role in ('admin', 'manager')
  ) then
    raise exception 'Solo administradores pueden vaciar notificaciones';
  end if;

  delete from notifications;
end;
$$;

comment on function admin_delete_notification_batch(uuid) is 
  'Elimina todas las notificaciones de un lote específico. Solo admin/manager.';

comment on function admin_clear_all_notifications() is 
  'Elimina TODAS las notificaciones del sistema. Solo admin/manager.';

-- ============================================================================
-- FIN DE MIGRACIÓN 053
-- ============================================================================
