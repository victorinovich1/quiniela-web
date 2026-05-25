-- Migración 051: Infraestructura del Sistema de Notificaciones
-- Descripción: Tabla notifications, preferencias de usuario, Realtime y auto-limpieza

-- ============================================================================
-- 1. TABLA NOTIFICATIONS
-- ============================================================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_created_at on notifications(created_at desc);
create index if not exists idx_notifications_user_read on notifications(user_id, read);

-- ============================================================================
-- 2. PREFERENCIAS EN PROFILES
-- ============================================================================
alter table profiles
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists notifications_sound boolean not null default true;

-- ============================================================================
-- 3. HABILITAR REALTIME
-- ============================================================================
-- Supabase Realtime permite suscripciones en tiempo real
alter publication supabase_realtime add table notifications;

-- ============================================================================
-- 4. AUTO-LIMPIEZA: Máximo 15 notificaciones por usuario
-- ============================================================================

-- Función que elimina notificaciones antiguas si el usuario supera 15
create or replace function cleanup_old_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_count int;
  excess_count int;
begin
  -- Contar notificaciones del usuario
  select count(*) into notification_count
  from notifications
  where user_id = NEW.user_id;
  
  -- Si supera 15, eliminar las más antiguas
  if notification_count > 15 then
    excess_count := notification_count - 15;
    
    delete from notifications
    where id in (
      select id
      from notifications
      where user_id = NEW.user_id
      order by created_at asc
      limit excess_count
    );
  end if;
  
  return NEW;
end;
$$;

-- Trigger que ejecuta la limpieza después de cada INSERT
drop trigger if exists trigger_cleanup_old_notifications on notifications;
create trigger trigger_cleanup_old_notifications
  after insert on notifications
  for each row
  execute function cleanup_old_notifications();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS
alter table notifications enable row level security;

-- Política: Los usuarios solo pueden ver sus propias notificaciones
create policy "Users can view own notifications"
  on notifications
  for select
  using (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar (marcar como leídas) sus notificaciones
create policy "Users can update own notifications"
  on notifications
  for update
  using (auth.uid() = user_id);

-- Política: Las funciones del servidor pueden insertar notificaciones a cualquier usuario
-- (esto se hará desde funciones security definer o desde el servidor con service_role)
create policy "Service can insert notifications"
  on notifications
  for insert
  with check (true);

-- Política: Los usuarios pueden borrar sus propias notificaciones
create policy "Users can delete own notifications"
  on notifications
  for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- FIN DE MIGRACIÓN 051
-- ============================================================================
