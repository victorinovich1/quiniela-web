-- Migración 054: Fix RLS de notifications y blindaje de funciones
-- Descripción: Corrige políticas "Always True" y aplica security lockdown completo

-- ============================================================================
-- 1. RLS POLICIES: Corregir lógica de SELECT y DELETE
-- ============================================================================

-- Drop políticas existentes
drop policy if exists "Users can view own notifications" on notifications;
drop policy if exists "Admins can view all notifications" on notifications;
drop policy if exists "Users can delete own notifications" on notifications;

-- SELECT: Usuario ve solo sus notificaciones OR es admin/manager (para historial)
create policy "Users and admins can view notifications"
  on notifications
  for select
  using (
    user_id = auth.uid() 
    or exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('admin', 'manager')
    )
  );

-- DELETE: Solo el dueño OR admin/manager
create policy "Users and admins can delete notifications"
  on notifications
  for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('admin', 'manager')
    )
  );

-- ============================================================================
-- 2. BLINDAJE DE FUNCIONES: admin_delete_notification_batch
-- ============================================================================
revoke all on function public.admin_delete_notification_batch(uuid) from public, anon, authenticated;
alter function public.admin_delete_notification_batch(uuid) security definer set search_path = public;
grant execute on function public.admin_delete_notification_batch(uuid) to authenticated;

comment on function public.admin_delete_notification_batch(uuid) is 
  'Elimina todas las notificaciones de un lote específico. Solo admin/manager. Security hardened.';

-- ============================================================================
-- 3. BLINDAJE DE FUNCIONES: admin_clear_all_notifications
-- ============================================================================
revoke all on function public.admin_clear_all_notifications() from public, anon, authenticated;
alter function public.admin_clear_all_notifications() security definer set search_path = public;
grant execute on function public.admin_clear_all_notifications() to authenticated;

comment on function public.admin_clear_all_notifications() is 
  'Elimina TODAS las notificaciones del sistema. Solo admin/manager. Security hardened.';

-- ============================================================================
-- 4. BLINDAJE DE FUNCIONES: cleanup_old_notifications (trigger function)
-- ============================================================================
revoke all on function public.cleanup_old_notifications() from public, anon, authenticated;
alter function public.cleanup_old_notifications() security definer set search_path = public;
-- NO grant execute porque es función de trigger (solo la BD la ejecuta)

comment on function public.cleanup_old_notifications() is 
  'Trigger function: limpia notificaciones antiguas cuando superan 15. Security hardened.';

-- ============================================================================
-- FIN DE MIGRACIÓN 054
-- ============================================================================
