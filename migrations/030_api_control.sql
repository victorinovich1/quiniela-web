-- Control total de sincronización API
alter table public.settings
  add column if not exists api_sync_enabled boolean default true;

alter table public.matches
  add column if not exists manual_override boolean default false,
  add column if not exists last_synced_at timestamptz;

comment on column public.settings.api_sync_enabled is 'Interruptor maestro para sincronización automática con API';
comment on column public.matches.manual_override is 'Si true, el Admin fijó este resultado manualmente y la API no debe tocarlo';
comment on column public.matches.last_synced_at is 'Última vez que la API actualizó este partido';
