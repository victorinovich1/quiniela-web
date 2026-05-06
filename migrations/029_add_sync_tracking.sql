-- Añade columnas para tracking de sincronización API
alter table public.settings
  add column if not exists last_sync_at timestamptz,
  add column if not exists last_sync_error text;

comment on column public.settings.last_sync_at is 'Última sincronización exitosa de resultados vía API';
comment on column public.settings.last_sync_error is 'Último error de sincronización (NULL si todo OK)';
