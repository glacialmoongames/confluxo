-- Execute este arquivo uma vez no SQL Editor de um projeto Supabase vazio.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9 ]{3,18}$'),
  username_key text not null unique check (char_length(username_key) between 3 and 18),
  wins bigint not null default 0 check (wins >= 0),
  losses bigint not null default 0 check (losses >= 0),
  created_at timestamptz not null default now()
);

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
create policy "Perfis visiveis para jogadores" on public.profiles for select to authenticated using (true);

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

create or replace function public.report_match_result(p_match_id uuid, p_opponent uuid, p_winner uuid, p_reason text default 'duelo')
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  confirmed boolean := false;
  inserted_match uuid;
begin
  if me is null or p_match_id is null or p_opponent is null or me = p_opponent or p_winner not in (me, p_opponent) then
    raise exception 'invalid match report';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_match_id::text, 0));
  insert into public.match_reports(match_id, reporter, opponent, winner, reason)
    values (p_match_id, me, p_opponent, p_winner, left(coalesce(p_reason, 'duelo'), 40))
    on conflict (match_id, reporter) do update set
      opponent = excluded.opponent, winner = excluded.winner, reason = excluded.reason;
  select exists(
    select 1 from public.match_reports r
    where r.match_id = p_match_id and r.reporter = p_opponent and r.opponent = me and r.winner = p_winner
  ) into confirmed;
  if not confirmed then return false; end if;
  insert into public.completed_matches(match_id, player_one, player_two, winner, reason)
    values (p_match_id, least(me,p_opponent), greatest(me,p_opponent), p_winner, left(coalesce(p_reason,'duelo'),40))
    on conflict (match_id) do nothing returning match_id into inserted_match;
  if inserted_match is null then return true; end if;
  update public.profiles set wins = wins + 1 where id = p_winner;
  update public.profiles set losses = losses + 1 where id in (me,p_opponent) and id <> p_winner;
  return true;
end;
$$;

revoke all on public.profiles, public.match_reports, public.completed_matches from anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on function public.report_match_result(uuid,uuid,uuid,text) from public, anon;
grant execute on function public.report_match_result(uuid,uuid,uuid,text) to authenticated;
