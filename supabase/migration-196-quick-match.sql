-- Versão 196: fila pública e temporária para Partida Rápida.
create table if not exists public.quick_match_queue (
  ticket uuid primary key,
  player_id uuid references public.profiles(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 24),
  deck text not null check (deck in ('xadria','wild','celestial','abyss','candy','gold')),
  status text not null default 'waiting' check (status in ('waiting','matched')),
  room_code text check (room_code ~ '^[A-Z0-9]{1,12}$'),
  role text check (role in ('host','guest')),
  created_at timestamptz not null default now(),
  matched_at timestamptz
);

alter table public.quick_match_queue enable row level security;

create or replace function public.join_quick_match(p_ticket uuid, p_name text, p_deck text)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  opponent public.quick_match_queue%rowtype;
  current_ticket public.quick_match_queue%rowtype;
  generated_code text;
  clean_name text := left(trim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g')),24);
begin
  if p_ticket is null or char_length(clean_name) < 1
    or p_deck not in ('xadria','wild','celestial','abyss','candy','gold') then
    raise exception 'invalid quick match request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('confluxo-quick-match',0));
  delete from public.quick_match_queue
    where created_at < now() - interval '3 minutes'
       or (status = 'matched' and matched_at < now() - interval '1 minute');
  select * into current_ticket from public.quick_match_queue where ticket = p_ticket;
  if found then
    return jsonb_build_object('status',current_ticket.status,'roomCode',current_ticket.room_code,'role',current_ticket.role);
  end if;
  select * into opponent from public.quick_match_queue q
  where q.status = 'waiting' and q.ticket <> p_ticket
    and (auth.uid() is null or q.player_id is null or q.player_id <> auth.uid())
  order by q.created_at limit 1 for update skip locked;
  if found then
    generated_code := 'Q' || upper(substr(md5(opponent.ticket::text || p_ticket::text),1,11));
    update public.quick_match_queue set status='matched',room_code=generated_code,role='host',matched_at=now() where ticket=opponent.ticket;
    insert into public.quick_match_queue(ticket,player_id,display_name,deck,status,room_code,role,matched_at)
      values(p_ticket,auth.uid(),clean_name,p_deck,'matched',generated_code,'guest',now());
    return jsonb_build_object('status','matched','roomCode',generated_code,'role','guest');
  end if;
  insert into public.quick_match_queue(ticket,player_id,display_name,deck) values(p_ticket,auth.uid(),clean_name,p_deck);
  return jsonb_build_object('status','waiting','roomCode',null,'role',null);
end;
$$;

create or replace function public.quick_match_status(p_ticket uuid)
returns jsonb language sql security definer set search_path = ''
as $$
  select coalesce((select jsonb_build_object('status',q.status,'roomCode',q.room_code,'role',q.role)
    from public.quick_match_queue q where q.ticket=p_ticket),jsonb_build_object('status','expired','roomCode',null,'role',null));
$$;

create or replace function public.leave_quick_match(p_ticket uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$ begin delete from public.quick_match_queue where ticket=p_ticket; return found; end; $$;

revoke all on public.quick_match_queue from anon, authenticated;
revoke all on function public.join_quick_match(uuid,text,text) from public;
revoke all on function public.quick_match_status(uuid) from public;
revoke all on function public.leave_quick_match(uuid) from public;
grant execute on function public.join_quick_match(uuid,text,text) to anon, authenticated;
grant execute on function public.quick_match_status(uuid) to anon, authenticated;
grant execute on function public.leave_quick_match(uuid) to anon, authenticated;
