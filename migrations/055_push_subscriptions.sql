-- Migración 055: Tabla para suscripciones de Web Push Notifications
-- Permite almacenar endpoints y llaves del navegador para enviar notificaciones
-- incluso cuando la web está cerrada.

-- Crear tabla de suscripciones push
create table if not exists public.push_subscriptions (
  id serial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Un usuario puede tener múltiples suscripciones (móvil + desktop)
  -- pero no duplicados del mismo endpoint
  unique(user_id, (subscription->>'endpoint'))
);

-- Índices
create index idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

-- RLS: El usuario solo puede ver y gestionar sus propias suscripciones
alter table public.push_subscriptions enable row level security;

create policy "Users can insert own subscriptions"
  on public.push_subscriptions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own subscriptions"
  on public.push_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
  on public.push_subscriptions
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Admin puede ver todas las suscripciones (para debugging)
create policy "Admins can view all subscriptions"
  on public.push_subscriptions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'manager')
    )
  );

-- Función para limpiar suscripciones huérfanas (ejecutar periódicamente)
create or replace function public.cleanup_orphan_subscriptions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.push_subscriptions
  where user_id not in (select id from public.profiles);
end;
$$;

revoke all on function public.cleanup_orphan_subscriptions() from public;
grant execute on function public.cleanup_orphan_subscriptions() to authenticated;

comment on table public.push_subscriptions is 'Almacena suscripciones de Web Push para enviar notificaciones al móvil';
comment on column public.push_subscriptions.subscription is 'Objeto JSON con endpoint, keys.p256dh y keys.auth del navegador';
