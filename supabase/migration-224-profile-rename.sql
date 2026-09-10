-- Versão 224: renomeação autenticada e data de criação nos perfis.
begin;

create or replace function public.rename_player_account(p_username text)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  clean_name text := trim(regexp_replace(coalesce(p_username, ''), '\s+', ' ', 'g'));
  clean_key text;
  login_email text;
  result jsonb;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  clean_key := lower(regexp_replace(translate(clean_name, 'ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ', 'AAAAAACEEEEIIIINOOOOOUUUUYaaaaaaceeeeiiiinooooouuuuyy'), '[^A-Za-z0-9]', '', 'g'));
  if clean_name !~ '^[A-Za-zÀ-ÖØ-öø-ÿ0-9 ]{3,18}$' or char_length(clean_key) < 3 then raise exception 'invalid username'; end if;
  login_email := clean_key || '@players.confluxo.invalid';
  if exists(select 1 from public.profiles where username_key=clean_key and id<>auth.uid())
    or exists(select 1 from auth.users where email=login_email and id<>auth.uid()) then
    raise exception 'username already taken' using errcode='23505';
  end if;
  update public.profiles set username=clean_name,username_key=clean_key where id=auth.uid();
  update auth.users set email=login_email,raw_user_meta_data=jsonb_set(coalesce(raw_user_meta_data,'{}'::jsonb),'{username}',to_jsonb(clean_name),true),updated_at=now() where id=auth.uid();
  update auth.identities set identity_data=jsonb_set(coalesce(identity_data,'{}'::jsonb),'{email}',to_jsonb(login_email),true),updated_at=now() where user_id=auth.uid() and provider='email';
  select jsonb_build_object('id',p.id,'username',p.username,'wins',p.wins,'losses',p.losses,'rating',p.rating,'profileIcon',p.profile_icon,'profileColor',p.profile_color,'deckUsage',p.deck_usage,'createdAt',p.created_at) into result from public.profiles p where p.id=auth.uid();
  return result;
end;
$$;

revoke all on function public.rename_player_account(text) from public, anon;
grant execute on function public.rename_player_account(text) to authenticated;

create or replace function public.get_player_profile(p_user uuid)
returns jsonb
language sql
stable
security definer set search_path = ''
as $$
  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id, 'username', p.username, 'wins', p.wins, 'losses', p.losses,
      'rating', p.rating, 'profileIcon', p.profile_icon, 'profileColor', p.profile_color,
      'deckUsage', p.deck_usage, 'createdAt', p.created_at
    ),
    'matches', coalesce((
      select jsonb_agg(recent.payload order by recent.completed_at desc)
      from (
        select m.completed_at, jsonb_build_object(
          'id', m.match_id, 'completedAt', m.completed_at, 'winner', m.winner, 'reason', m.reason,
          'playerOne', jsonb_build_object('id', m.player_one, 'username', p1.username, 'deck', m.player_one_deck),
          'playerTwo', jsonb_build_object('id', m.player_two, 'username', p2.username, 'deck', m.player_two_deck)
        ) as payload
        from public.completed_matches m
        join public.profiles p1 on p1.id = m.player_one
        join public.profiles p2 on p2.id = m.player_two
        where m.player_one = p_user or m.player_two = p_user
        order by m.completed_at desc
        limit 10
      ) recent
    ), '[]'::jsonb)
  )
  from public.profiles p
  where p.id = p_user;
$$;

revoke all on function public.get_player_profile(uuid) from public;
grant execute on function public.get_player_profile(uuid) to anon, authenticated;

commit;
