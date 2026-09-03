-- Execute este arquivo uma vez no SQL Editor de um projeto Supabase vazio.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9 ]{3,18}$'),
  username_key text not null unique check (char_length(username_key) between 3 and 18),
  wins bigint not null default 0 check (wins >= 0),
  losses bigint not null default 0 check (losses >= 0),
  rating bigint not null default 1000 check (rating >= 0),
  profile_icon text not null default 'flower-twirl',
  profile_color text not null default 'xadria' check (profile_color in ('xadria','wild','celestial','abyss','candy','gold')),
  deck_usage jsonb not null default '{}'::jsonb check (jsonb_typeof(deck_usage) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists deck_usage jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists rating bigint not null default 1000;
alter table public.profiles add column if not exists profile_icon text not null default 'flower-twirl';
alter table public.profiles add column if not exists profile_color text not null default 'xadria';
alter table public.match_reports add column if not exists deck text;
alter table public.completed_matches add column if not exists player_one_deck text;
alter table public.completed_matches add column if not exists player_two_deck text;

create table if not exists public.match_reports (
  match_id uuid not null,
  reporter uuid not null references public.profiles(id) on delete cascade,
  opponent uuid not null references public.profiles(id) on delete cascade,
  winner uuid not null references public.profiles(id) on delete cascade,
  reason text not null default 'duelo',
  created_at timestamptz not null default now(),
  primary key (match_id, reporter),
  check (reporter <> opponent),
  check (winner = reporter or winner = opponent)
);

create table if not exists public.completed_matches (
  match_id uuid primary key,
  player_one uuid not null references public.profiles(id),
  player_two uuid not null references public.profiles(id),
  winner uuid not null references public.profiles(id),
  reason text not null,
  completed_at timestamptz not null default now(),
  check (player_one <> player_two),
  check (winner = player_one or winner = player_two)
);

alter table public.profiles enable row level security;
alter table public.match_reports enable row level security;
alter table public.completed_matches enable row level security;

drop policy if exists "Perfis visiveis para jogadores" on public.profiles;
create policy "Perfis visiveis para jogadores" on public.profiles for select to anon, authenticated using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  requested_name text := trim(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', ''), '\s+', ' ', 'g'));
  requested_key text;
begin
  requested_key := lower(regexp_replace(requested_name, '[^A-Za-z0-9]', '', 'g'));
  if requested_name !~ '^[A-Za-z0-9 ]{3,18}$' or char_length(requested_key) < 3 then
    raise exception 'invalid username';
  end if;
  insert into public.profiles (id, username, username_key) values (new.id, requested_name, requested_key);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

drop function if exists public.report_match_result(uuid,uuid,uuid,text);
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
  update public.profiles set wins = wins + 1 where id = p_winner;
  update public.profiles set losses = losses + 1 where id in (me,p_opponent) and id <> p_winner;
  update public.profiles set rating = rating + 30 where id = p_winner;
  update public.profiles set rating = greatest(0,rating - 30) where id in (me,p_opponent) and id <> p_winner;
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

revoke all on public.profiles, public.match_reports, public.completed_matches from anon, authenticated;
grant select on public.profiles to anon, authenticated;
revoke all on function public.report_match_result(uuid,uuid,uuid,text,text) from public, anon;
grant execute on function public.report_match_result(uuid,uuid,uuid,text,text) to authenticated;
revoke all on function public.set_profile_icon(text) from public, anon;
grant execute on function public.set_profile_icon(text) to authenticated;
revoke all on function public.set_profile_style(text,text) from public, anon;
grant execute on function public.set_profile_style(text,text) to authenticated;
revoke all on function public.get_player_profile(uuid) from public;
grant execute on function public.get_player_profile(uuid) to anon, authenticated;

-- Fila temporária usada pelo botão Partida Rápida (versão 196).
create table if not exists public.quick_match_queue (
  ticket uuid primary key,
  player_id uuid references public.profiles(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 24),
  deck text not null check (deck in ('xadria','wild','celestial','abyss','candy','gold')),
  status text not null default 'waiting' check (status in ('waiting','matched')),
  room_code text check (room_code ~ '^[A-Z0-9]{1,12}$'),
  role text check (role in ('host','guest')),
  created_at timestamptz not null default now(), matched_at timestamptz
);
alter table public.quick_match_queue enable row level security;

create or replace function public.join_quick_match(p_ticket uuid,p_name text,p_deck text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare opponent public.quick_match_queue%rowtype; current_ticket public.quick_match_queue%rowtype; generated_code text;
clean_name text:=left(trim(regexp_replace(coalesce(p_name,''),'\s+',' ','g')),24);
begin
 if p_ticket is null or char_length(clean_name)<1 or p_deck not in ('xadria','wild','celestial','abyss','candy','gold') then raise exception 'invalid quick match request'; end if;
 perform pg_advisory_xact_lock(hashtextextended('confluxo-quick-match',0));
 delete from public.quick_match_queue where created_at<now()-interval '3 minutes' or(status='matched' and matched_at<now()-interval '1 minute');
 select * into current_ticket from public.quick_match_queue where ticket=p_ticket;
 if found then return jsonb_build_object('status',current_ticket.status,'roomCode',current_ticket.room_code,'role',current_ticket.role); end if;
 select * into opponent from public.quick_match_queue q where q.status='waiting' and q.ticket<>p_ticket and(auth.uid() is null or q.player_id is null or q.player_id<>auth.uid()) order by q.created_at limit 1 for update skip locked;
 if found then
  generated_code:='Q'||upper(substr(md5(opponent.ticket::text||p_ticket::text),1,11));
  update public.quick_match_queue set status='matched',room_code=generated_code,role='host',matched_at=now() where ticket=opponent.ticket;
  insert into public.quick_match_queue(ticket,player_id,display_name,deck,status,room_code,role,matched_at) values(p_ticket,auth.uid(),clean_name,p_deck,'matched',generated_code,'guest',now());
  return jsonb_build_object('status','matched','roomCode',generated_code,'role','guest');
 end if;
 insert into public.quick_match_queue(ticket,player_id,display_name,deck) values(p_ticket,auth.uid(),clean_name,p_deck);
 return jsonb_build_object('status','waiting','roomCode',null,'role',null);
end; $$;
create or replace function public.quick_match_status(p_ticket uuid) returns jsonb language sql security definer set search_path='' as $$ select coalesce((select jsonb_build_object('status',q.status,'roomCode',q.room_code,'role',q.role) from public.quick_match_queue q where q.ticket=p_ticket),jsonb_build_object('status','expired','roomCode',null,'role',null)); $$;
create or replace function public.leave_quick_match(p_ticket uuid) returns boolean language plpgsql security definer set search_path='' as $$ begin delete from public.quick_match_queue where ticket=p_ticket; return found; end; $$;
revoke all on public.quick_match_queue from anon,authenticated;
revoke all on function public.join_quick_match(uuid,text,text),public.quick_match_status(uuid),public.leave_quick_match(uuid) from public;
grant execute on function public.join_quick_match(uuid,text,text),public.quick_match_status(uuid),public.leave_quick_match(uuid) to anon,authenticated;
