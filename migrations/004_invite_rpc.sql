-- =====================================================
-- 004 - RPCs para invitaciones
-- =====================================================

create or replace function public.redeem_invite(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_inv invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  select email into v_email from auth.users where id = v_user_id;

  if exists(select 1 from invitations where used_by = v_user_id) then
    return true;
  end if;

  select * into v_inv from invitations where code = p_code for update;
  if not found then
    raise exception 'Código de invitación inválido';
  end if;

  if v_inv.used_by is not null then
    raise exception 'Este código ya fue usado';
  end if;

  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    raise exception 'Este código ya expiró';
  end if;

  if v_inv.email is not null and lower(v_inv.email) <> lower(v_email) then
    raise exception 'Este código no corresponde a tu correo';
  end if;

  update invitations set used_by = v_user_id, used_at = now() where code = p_code;
  return true;
end;
$$;

grant execute on function public.redeem_invite(text) to authenticated;

create or replace function public.validate_invite(p_code text, p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invitations%rowtype;
begin
  select * into v_inv from invitations where code = p_code;
  if not found then return false; end if;
  if v_inv.used_by is not null then return false; end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then return false; end if;
  if v_inv.email is not null and lower(v_inv.email) <> lower(p_email) then return false; end if;
  return true;
end;
$$;

grant execute on function public.validate_invite(text, text) to anon, authenticated;
