-- Versão 216: libera de forma direta e repetível a cor de perfil Chamas Egípcias.
begin;

alter table public.profiles
  drop constraint if exists profiles_profile_color_check;

alter table public.profiles
  add constraint profiles_profile_color_check
  check (profile_color in ('xadria','wild','celestial','abyss','candy','gold','egyptian'));

create or replace function public.set_profile_style(p_icon text, p_color text)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null
    or p_icon !~ '^[a-z0-9-]{1,40}$'
    or p_color not in ('xadria','wild','celestial','abyss','candy','gold','egyptian') then
    raise exception 'invalid profile style';
  end if;

  update public.profiles
  set profile_icon = p_icon,
      profile_color = p_color
  where id = auth.uid();

  return found;
end;
$$;

revoke all on function public.set_profile_style(text,text) from public, anon;
grant execute on function public.set_profile_style(text,text) to authenticated;

commit;
