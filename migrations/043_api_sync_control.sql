-- =====================================================
-- 043 - Control total del Admin sobre sincronización API
-- =====================================================

-- Añadir columna de intervalo de sincronización (en minutos)
alter table public.settings
  add column if not exists sync_interval_minutes int not null default 10;

-- Renombrar last_sync_error a last_sync_status para mayor claridad
-- (será 'online' en éxito, o mensaje de error)
alter table public.settings
  add column if not exists last_sync_status text;

-- Migrar datos existentes: si había error, copiarlo
update public.settings
set last_sync_status = last_sync_error
where last_sync_error is not null;

-- Ya no necesitamos last_sync_error (deprecado en favor de last_sync_status)
-- Pero lo mantenemos para compatibilidad con código legacy
-- alter table public.settings drop column if exists last_sync_error;

comment on column public.settings.sync_interval_minutes is 'Intervalo mínimo entre sincronizaciones (en minutos)';
comment on column public.settings.last_sync_status is 'Estado de última sincronización: "online" si exitosa, o mensaje de error';
