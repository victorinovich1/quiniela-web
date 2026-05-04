-- =====================================================
-- 007 - Auto-promote del organizador a admin
-- Cambia el email hardcodeado si despliegas con otro dueño.
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'participant';
begin
  if lower(new.email) = 'victorinovich@gmail.com' then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    v_role
  );
  return new;
end;
$$;

-- Por si el organizador ya existiera antes
update public.profiles
set role = 'admin'
where lower(email) = 'victorinovich@gmail.com';
