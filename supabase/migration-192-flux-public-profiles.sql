-- Versão 192: cor do perfil e histórico público das dez partidas mais recentes.
alter table public.profiles add column if not exists profile_color text not null default 'xadria';

create or replace function public.set_profile_style(p_icon text, p_color text)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null or p_icon !~ '^[a-z0-9-]{1,40}$'
    or p_color not in ('xadria','wild','celestial','abyss','candy','gold') then
    raise exception 'invalid profile style';
  end if;
  update public.profiles set profile_icon = p_icon, profile_color = p_color where id = auth.uid();
  return found;
end;
$$;

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
      'deckUsage', p.deck_usage
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

revoke all on function public.set_profile_style(text,text) from public, anon;
grant execute on function public.set_profile_style(text,text) to authenticated;
revoke all on function public.get_player_profile(uuid) from public;
grant execute on function public.get_player_profile(uuid) to anon, authenticated;
