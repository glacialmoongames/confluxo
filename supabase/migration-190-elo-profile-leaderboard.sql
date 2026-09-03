-- Versão 190: Elo, ícone de perfil e leaderboard público.
alter table public.profiles add column if not exists rating bigint not null default 1000;
alter table public.profiles add column if not exists profile_icon text not null default 'flower-twirl';

drop policy if exists "Perfis visiveis para jogadores" on public.profiles;
create policy "Perfis visiveis para jogadores" on public.profiles for select to anon, authenticated using (true);
grant select on public.profiles to anon, authenticated;

create or replace function public.report_match_result(p_match_id uuid, p_opponent uuid, p_winner uuid, p_reason text default 'duelo', p_deck text default null)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  confirmed boolean := false;
  inserted_match uuid;
  opponent_deck text;
  player_one_deck text;
  player_two_deck text;
begin
  if me is null or p_match_id is null or p_opponent is null or me = p_opponent or p_winner not in (me, p_opponent)
    or p_deck not in ('xadria','wild','celestial','abyss','candy','gold') then
    raise exception 'invalid match report';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_match_id::text, 0));
  insert into public.match_reports(match_id, reporter, opponent, winner, reason, deck)
    values (p_match_id, me, p_opponent, p_winner, left(coalesce(p_reason, 'duelo'), 40), p_deck)
    on conflict (match_id, reporter) do update set
      opponent = excluded.opponent, winner = excluded.winner, reason = excluded.reason, deck = excluded.deck;
  select exists(
    select 1 from public.match_reports r
    where r.match_id = p_match_id and r.reporter = p_opponent and r.opponent = me and r.winner = p_winner
  ) into confirmed;
  if not confirmed then return false; end if;
  select deck into opponent_deck from public.match_reports where match_id = p_match_id and reporter = p_opponent;
  if me < p_opponent then player_one_deck := p_deck; player_two_deck := opponent_deck;
  else player_one_deck := opponent_deck; player_two_deck := p_deck; end if;
  insert into public.completed_matches(match_id, player_one, player_two, winner, reason, player_one_deck, player_two_deck)
    values (p_match_id, least(me,p_opponent), greatest(me,p_opponent), p_winner, left(coalesce(p_reason,'duelo'),40), player_one_deck, player_two_deck)
    on conflict (match_id) do nothing returning match_id into inserted_match;
  if inserted_match is null then return true; end if;
  update public.profiles set wins = wins + 1, rating = rating + 30 where id = p_winner;
  update public.profiles set losses = losses + 1, rating = greatest(0,rating - 30) where id in (me,p_opponent) and id <> p_winner;
  update public.profiles set deck_usage = jsonb_set(deck_usage, array[p_deck], to_jsonb(coalesce((deck_usage ->> p_deck)::bigint,0)+1), true) where id = me;
  update public.profiles set deck_usage = jsonb_set(deck_usage, array[opponent_deck], to_jsonb(coalesce((deck_usage ->> opponent_deck)::bigint,0)+1), true) where id = p_opponent;
  return true;
end;
$$;

create or replace function public.set_profile_icon(p_icon text)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null or p_icon !~ '^[a-z0-9-]{1,40}$' then
    raise exception 'invalid profile icon';
  end if;
  update public.profiles set profile_icon = p_icon where id = auth.uid();
  return found;
end;
$$;

revoke all on function public.set_profile_icon(text) from public, anon;
grant execute on function public.set_profile_icon(text) to authenticated;
