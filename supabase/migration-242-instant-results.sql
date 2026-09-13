-- Versão 242: resultado atômico e instantâneo, com histórico de convidados.
begin;

alter table public.completed_matches add column if not exists flux_delta smallint check (flux_delta between 27 and 33);

drop function if exists public.report_match_result(uuid,uuid,uuid,text,text);
create function public.report_match_result(p_match_id uuid,p_opponent uuid,p_winner uuid,p_reason text default 'duelo',p_deck text default null)
returns integer language plpgsql security definer set search_path='' as $$
declare
  me uuid:=auth.uid();mine_player smallint;mine_deck text;rival_player smallint;rival_deck text;
  inserted_match uuid;player_one_deck text;player_two_deck text;
  delta smallint:=floor(random()*7)::smallint+27;saved_delta smallint;saved_winner uuid;
begin
  if me is null or p_match_id is null or p_opponent is null or me=p_opponent or p_winner not in(me,p_opponent)
    or p_deck not in('xadria','wild','celestial','abyss','candy','gold','egyptian','insects') then raise exception 'invalid match report';end if;
  perform pg_advisory_xact_lock(hashtextextended(p_match_id::text,0));
  select player,deck into mine_player,mine_deck from public.match_presence where match_id=p_match_id and account_id=me order by last_seen desc limit 1;
  select player,deck into rival_player,rival_deck from public.match_presence where match_id=p_match_id and account_id=p_opponent order by last_seen desc limit 1;
  if mine_player is null or rival_player is null or mine_player=rival_player or mine_deck<>p_deck then raise exception 'match presence unavailable';end if;
  select flux_delta,winner into saved_delta,saved_winner from public.completed_matches where match_id=p_match_id and player_one in(me,p_opponent) and player_two in(me,p_opponent);
  if saved_delta is not null then return case when saved_winner=me then saved_delta else -saved_delta end;end if;
  if me<p_opponent then player_one_deck:=mine_deck;player_two_deck:=rival_deck;else player_one_deck:=rival_deck;player_two_deck:=mine_deck;end if;
  insert into public.completed_matches(match_id,player_one,player_two,winner,reason,player_one_deck,player_two_deck,flux_delta)
    values(p_match_id,least(me,p_opponent),greatest(me,p_opponent),p_winner,left(coalesce(p_reason,'duelo'),40),player_one_deck,player_two_deck,delta)
    on conflict(match_id) do nothing returning match_id into inserted_match;
  if inserted_match is null then select flux_delta,winner into saved_delta,saved_winner from public.completed_matches where match_id=p_match_id;return case when saved_winner=me then saved_delta else -saved_delta end;end if;
  update public.profiles set wins=wins+1,rating=rating+delta where id=p_winner;
  update public.profiles set losses=losses+1,rating=greatest(0,rating-delta) where id in(me,p_opponent) and id<>p_winner;
  update public.profiles set deck_usage=jsonb_set(deck_usage,array[mine_deck],to_jsonb(coalesce((deck_usage->>mine_deck)::bigint,0)+1),true) where id=me;
  update public.profiles set deck_usage=jsonb_set(deck_usage,array[rival_deck],to_jsonb(coalesce((deck_usage->>rival_deck)::bigint,0)+1),true) where id=p_opponent;
  return case when p_winner=me then delta else -delta end;
end;$$;

revoke all on function public.report_match_result(uuid,uuid,uuid,text,text) from public,anon;
grant execute on function public.report_match_result(uuid,uuid,uuid,text,text) to authenticated;

create or replace function public.get_player_profile(p_user uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'profile',jsonb_build_object('id',p.id,'username',p.username,'wins',p.wins,'losses',p.losses,'rating',p.rating,'profileIcon',p.profile_icon,'profileColor',p.profile_color,'deckUsage',p.deck_usage,'createdAt',p.created_at),
    'matches',coalesce((select jsonb_agg(recent.payload order by recent.completed_at desc) from(
      select history.completed_at,history.payload from(
        select m.completed_at,jsonb_build_object('id',m.match_id,'completedAt',m.completed_at,'winner',m.winner,'reason',m.reason,
          'playerOne',jsonb_build_object('id',m.player_one,'username',p1.username,'deck',m.player_one_deck),
          'playerTwo',jsonb_build_object('id',m.player_two,'username',p2.username,'deck',m.player_two_deck)) payload
        from public.completed_matches m join public.profiles p1 on p1.id=m.player_one join public.profiles p2 on p2.id=m.player_two
        where m.player_one=p_user or m.player_two=p_user
        union all
        select g.completed_at,jsonb_build_object('id',g.match_id,'completedAt',g.completed_at,'winner',case when g.won then g.player_id else null end,'reason',g.reason,
          'playerOne',jsonb_build_object('id',g.player_id,'username',p.username,'deck',g.deck),
          'playerTwo',jsonb_build_object('id',null,'username',g.guest_name,'deck',null)) payload
        from public.guest_match_results g where g.player_id=p_user
      )history order by history.completed_at desc limit 10
    )recent),'[]'::jsonb)
  ) from public.profiles p where p.id=p_user;
$$;

revoke all on function public.get_player_profile(uuid) from public;
grant execute on function public.get_player_profile(uuid) to anon,authenticated;

commit;
