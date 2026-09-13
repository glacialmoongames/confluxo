-- Versão 243: confirmação imediata, idempotente e independente da presença P2P do adversário.
begin;

drop function if exists public.report_match_result(uuid,uuid,uuid,text,text,text);
drop function if exists public.report_match_result(uuid,uuid,uuid,text,text);

create function public.report_match_result(p_match_id uuid,p_opponent uuid,p_winner uuid,p_reason text,p_deck text,p_opponent_deck text)
returns integer language plpgsql security definer set search_path='' as $$
declare
  me uuid:=auth.uid();inserted_match uuid;player_one_deck text;player_two_deck text;
  rival_deck text:=p_opponent_deck;delta smallint:=floor(random()*7)::smallint+27;
  saved_delta smallint;saved_winner uuid;
begin
  if me is null or p_match_id is null or p_opponent is null or me=p_opponent or p_winner not in(me,p_opponent)
    or p_deck not in('xadria','wild','celestial','abyss','candy','gold','egyptian','insects')
    or(p_opponent_deck is not null and p_opponent_deck not in('xadria','wild','celestial','abyss','candy','gold','egyptian','insects'))
    or not exists(select 1 from public.profiles where id=p_opponent) then raise exception 'invalid match result';end if;
  perform pg_advisory_xact_lock(hashtextextended(p_match_id::text,0));
  select flux_delta,winner into saved_delta,saved_winner from public.completed_matches
    where match_id=p_match_id and player_one in(me,p_opponent) and player_two in(me,p_opponent);
  if saved_delta is not null then return case when saved_winner=me then saved_delta else -saved_delta end;end if;
  if rival_deck is null then select deck into rival_deck from public.match_presence where match_id=p_match_id and account_id=p_opponent order by last_seen desc limit 1;end if;
  if me<p_opponent then player_one_deck:=p_deck;player_two_deck:=rival_deck;else player_one_deck:=rival_deck;player_two_deck:=p_deck;end if;
  insert into public.completed_matches(match_id,player_one,player_two,winner,reason,player_one_deck,player_two_deck,flux_delta)
    values(p_match_id,least(me,p_opponent),greatest(me,p_opponent),p_winner,left(coalesce(p_reason,'duelo'),40),player_one_deck,player_two_deck,delta)
    on conflict(match_id) do nothing returning match_id into inserted_match;
  if inserted_match is null then
    select flux_delta,winner into saved_delta,saved_winner from public.completed_matches where match_id=p_match_id;
    return case when saved_winner=me then saved_delta else -saved_delta end;
  end if;
  update public.profiles set wins=wins+1,rating=rating+delta where id=p_winner;
  update public.profiles set losses=losses+1,rating=greatest(0,rating-delta) where id in(me,p_opponent) and id<>p_winner;
  update public.profiles set deck_usage=jsonb_set(deck_usage,array[p_deck],to_jsonb(coalesce((deck_usage->>p_deck)::bigint,0)+1),true) where id=me;
  if rival_deck is not null then update public.profiles set deck_usage=jsonb_set(deck_usage,array[rival_deck],to_jsonb(coalesce((deck_usage->>rival_deck)::bigint,0)+1),true) where id=p_opponent;end if;
  return case when p_winner=me then delta else -delta end;
end;$$;

-- Compatibilidade com páginas antigas ainda abertas: tenta recuperar o deck rival da presença.
create function public.report_match_result(p_match_id uuid,p_opponent uuid,p_winner uuid,p_reason text default 'duelo',p_deck text default null)
returns integer language plpgsql security definer set search_path='' as $$
declare rival_deck text;
begin
  select deck into rival_deck from public.match_presence where match_id=p_match_id and account_id=p_opponent order by last_seen desc limit 1;
  return public.report_match_result(p_match_id,p_opponent,p_winner,p_reason,p_deck,rival_deck);
end;$$;

revoke all on function public.report_match_result(uuid,uuid,uuid,text,text,text),public.report_match_result(uuid,uuid,uuid,text,text) from public,anon;
grant execute on function public.report_match_result(uuid,uuid,uuid,text,text,text),public.report_match_result(uuid,uuid,uuid,text,text) to authenticated;

commit;
