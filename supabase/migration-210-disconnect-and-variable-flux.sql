-- Versão 210: presença online, derrota após 90 segundos e Flux variável.
create table if not exists public.match_presence (
  match_id uuid not null,
  player smallint not null check (player in (1,2)),
  session_id uuid not null,
  account_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  deck text not null check (deck in ('xadria','wild','celestial','abyss','candy','gold')),
  last_seen timestamptz not null default now(),
  primary key (match_id, player)
);

create table if not exists public.disconnect_results (
  match_id uuid primary key,
  winner_player smallint not null check (winner_player in (1,2)),
  flux_delta smallint not null check (flux_delta between 27 and 33),
  completed_at timestamptz not null default now()
);

create table if not exists public.guest_match_results (
  match_id uuid primary key,
  player_id uuid not null references public.profiles(id) on delete cascade,
  won boolean not null,
  guest_name text not null,
  deck text not null check (deck in ('xadria','wild','celestial','abyss','candy','gold')),
  reason text not null,
  flux_delta smallint not null check (flux_delta between 27 and 33),
  completed_at timestamptz not null default now()
);

alter table public.match_presence enable row level security;
alter table public.disconnect_results enable row level security;
alter table public.guest_match_results enable row level security;

create or replace function public.touch_match_presence(
  p_match_id uuid, p_player smallint, p_session uuid, p_name text, p_deck text
)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  affected bigint;
  clean_name text := left(trim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g')),24);
begin
  if p_match_id is null or p_player not in (1,2) or p_session is null
    or char_length(clean_name) < 1
    or p_deck not in ('xadria','wild','celestial','abyss','candy','gold') then
    raise exception 'invalid match presence';
  end if;
  delete from public.match_presence where last_seen < now() - interval '1 day';
  insert into public.match_presence(match_id,player,session_id,account_id,display_name,deck,last_seen)
    values(p_match_id,p_player,p_session,auth.uid(),clean_name,p_deck,now())
    on conflict(match_id,player) do update set
      session_id=excluded.session_id,account_id=excluded.account_id,display_name=excluded.display_name,deck=excluded.deck,last_seen=now()
    where public.match_presence.session_id=excluded.session_id
       or public.match_presence.last_seen<now()-interval '30 seconds'
       or (auth.uid() is not null and public.match_presence.account_id=auth.uid());
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.claim_disconnect_win(p_match_id uuid, p_player smallint, p_session uuid)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  mine public.match_presence%rowtype;
  opponent public.match_presence%rowtype;
  saved public.disconnect_results%rowtype;
  delta smallint := floor(random()*7)::smallint + 27;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_match_id::text,0));
  select * into mine from public.match_presence
    where match_id=p_match_id and player=p_player and session_id=p_session;
  select * into opponent from public.match_presence
    where match_id=p_match_id and player=case when p_player=1 then 2 else 1 end;
  if mine.match_id is null or opponent.match_id is null then
    return jsonb_build_object('status','unavailable');
  end if;
  if mine.last_seen < now() - interval '30 seconds' then
    return jsonb_build_object('status','inactive');
  end if;
  if opponent.last_seen > now() - interval '90 seconds' then
    return jsonb_build_object('status','waiting');
  end if;
  insert into public.disconnect_results(match_id,winner_player,flux_delta)
    values(p_match_id,p_player,delta)
    on conflict(match_id) do nothing returning * into saved;
  if saved.match_id is null then
    select * into saved from public.disconnect_results where match_id=p_match_id;
    return jsonb_build_object('status',case when saved.winner_player=p_player then 'claimed' else 'lost' end,'fluxDelta',saved.flux_delta);
  end if;
  if mine.account_id is not null then
    update public.profiles set wins=wins+1,rating=rating+delta,
      deck_usage=jsonb_set(deck_usage,array[mine.deck],to_jsonb(coalesce((deck_usage->>mine.deck)::bigint,0)+1),true)
      where id=mine.account_id;
  end if;
  if opponent.account_id is not null then
    update public.profiles set losses=losses+1,rating=greatest(0,rating-delta),
      deck_usage=jsonb_set(deck_usage,array[opponent.deck],to_jsonb(coalesce((deck_usage->>opponent.deck)::bigint,0)+1),true)
      where id=opponent.account_id;
  end if;
  return jsonb_build_object('status','claimed','fluxDelta',delta);
end;
$$;

create or replace function public.report_guest_match_result(
  p_match_id uuid, p_won boolean, p_guest_name text, p_reason text, p_deck text
)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  delta smallint := floor(random()*7)::smallint + 27;
  inserted uuid;
  saved public.guest_match_results%rowtype;
begin
  if me is null or p_match_id is null or p_won is null
    or p_deck not in ('xadria','wild','celestial','abyss','candy','gold') then
    raise exception 'invalid guest match report';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_match_id::text,0));
  insert into public.guest_match_results(match_id,player_id,won,guest_name,deck,reason,flux_delta)
    values(p_match_id,me,p_won,left(coalesce(p_guest_name,'Convidado'),24),p_deck,left(coalesce(p_reason,'duelo'),40),delta)
    on conflict(match_id) do nothing returning match_id into inserted;
  if inserted is null then
    select * into saved from public.guest_match_results where match_id=p_match_id and player_id=me;
    if saved.match_id is null then return 0; end if;
    return case when saved.won then saved.flux_delta else -saved.flux_delta end;
  end if;
  if p_won then
    update public.profiles set wins=wins+1,rating=rating+delta where id=me;
  else
    update public.profiles set losses=losses+1,rating=greatest(0,rating-delta) where id=me;
  end if;
  update public.profiles set deck_usage=jsonb_set(deck_usage,array[p_deck],to_jsonb(coalesce((deck_usage->>p_deck)::bigint,0)+1),true) where id=me;
  return case when p_won then delta else -delta end;
end;
$$;

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
  delta smallint := floor(random()*7)::smallint + 27;
begin
  if me is null or p_match_id is null or p_opponent is null or me = p_opponent or p_winner not in (me,p_opponent)
    or p_deck not in ('xadria','wild','celestial','abyss','candy','gold') then raise exception 'invalid match report'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_match_id::text,0));
  insert into public.match_reports(match_id,reporter,opponent,winner,reason,deck)
    values(p_match_id,me,p_opponent,p_winner,left(coalesce(p_reason,'duelo'),40),p_deck)
    on conflict(match_id,reporter) do update set opponent=excluded.opponent,winner=excluded.winner,reason=excluded.reason,deck=excluded.deck;
  select exists(select 1 from public.match_reports r where r.match_id=p_match_id and r.reporter=p_opponent and r.opponent=me and r.winner=p_winner) into confirmed;
  if not confirmed then return false; end if;
  select deck into opponent_deck from public.match_reports where match_id=p_match_id and reporter=p_opponent;
  if me<p_opponent then player_one_deck:=p_deck;player_two_deck:=opponent_deck;else player_one_deck:=opponent_deck;player_two_deck:=p_deck;end if;
  insert into public.completed_matches(match_id,player_one,player_two,winner,reason,player_one_deck,player_two_deck)
    values(p_match_id,least(me,p_opponent),greatest(me,p_opponent),p_winner,left(coalesce(p_reason,'duelo'),40),player_one_deck,player_two_deck)
    on conflict(match_id) do nothing returning match_id into inserted_match;
  if inserted_match is null then return true; end if;
  update public.profiles set wins=wins+1,rating=rating+delta where id=p_winner;
  update public.profiles set losses=losses+1,rating=greatest(0,rating-delta) where id in(me,p_opponent) and id<>p_winner;
  update public.profiles set deck_usage=jsonb_set(deck_usage,array[p_deck],to_jsonb(coalesce((deck_usage->>p_deck)::bigint,0)+1),true) where id=me;
  update public.profiles set deck_usage=jsonb_set(deck_usage,array[opponent_deck],to_jsonb(coalesce((deck_usage->>opponent_deck)::bigint,0)+1),true) where id=p_opponent;
  return true;
end;
$$;

revoke all on public.match_presence,public.disconnect_results,public.guest_match_results from anon,authenticated;
revoke all on function public.touch_match_presence(uuid,smallint,uuid,text,text) from public;
revoke all on function public.claim_disconnect_win(uuid,smallint,uuid) from public;
revoke all on function public.report_guest_match_result(uuid,boolean,text,text,text) from public,anon;
grant execute on function public.touch_match_presence(uuid,smallint,uuid,text,text) to anon,authenticated;
grant execute on function public.claim_disconnect_win(uuid,smallint,uuid) to anon,authenticated;
grant execute on function public.report_guest_match_result(uuid,boolean,text,text,text) to authenticated;
