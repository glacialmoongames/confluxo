-- Versão 223: permite nomes de jogador com acentos latinos.
begin;

alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles add constraint profiles_username_check
  check (username ~ '^[A-Za-zÀ-ÖØ-öø-ÿ0-9 ]{3,18}$');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  requested_name text := trim(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', ''), '\s+', ' ', 'g'));
  requested_key text;
begin
  requested_key := lower(regexp_replace(translate(requested_name, 'ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ', 'AAAAAACEEEEIIIINOOOOOUUUUYaaaaaaceeeeiiiinooooouuuuyy'), '[^A-Za-z0-9]', '', 'g'));
  if requested_name !~ '^[A-Za-zÀ-ÖØ-öø-ÿ0-9 ]{3,18}$' or char_length(requested_key) < 3 then
    raise exception 'invalid username';
  end if;
  insert into public.profiles (id, username, username_key) values (new.id, requested_name, requested_key);
  return new;
end;
$$;

commit;
