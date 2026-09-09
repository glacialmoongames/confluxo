-- Versão 222: libera Insetos Calamitosos no matchmaking, histórico e perfil.
begin;

alter table public.profiles drop constraint if exists profiles_profile_color_check;
alter table public.profiles add constraint profiles_profile_color_check
  check (profile_color in ('xadria','wild','celestial','abyss','candy','gold','egyptian','insects'));

alter table public.quick_match_queue drop constraint if exists quick_match_queue_deck_check;
alter table public.quick_match_queue add constraint quick_match_queue_deck_check
  check (deck in ('xadria','wild','celestial','abyss','candy','gold','egyptian','insects'));

alter table public.match_presence drop constraint if exists match_presence_deck_check;
alter table public.match_presence add constraint match_presence_deck_check
  check (deck in ('xadria','wild','celestial','abyss','candy','gold','egyptian','insects'));

alter table public.guest_match_results drop constraint if exists guest_match_results_deck_check;
alter table public.guest_match_results add constraint guest_match_results_deck_check
  check (deck in ('xadria','wild','celestial','abyss','candy','gold','egyptian','insects'));

do $$
declare routine record; definition text;
begin
  for routine in
    select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in
      ('set_profile_style','join_quick_match','touch_match_presence','report_guest_match_result','report_match_result')
  loop
    definition:=pg_get_functiondef(routine.oid);
    definition:=replace(definition,
      $old$'xadria','wild','celestial','abyss','candy','gold','egyptian'$old$,
      $new$'xadria','wild','celestial','abyss','candy','gold','egyptian','insects'$new$);
    definition:=replace(definition,
      $old$'xadria'::text, 'wild'::text, 'celestial'::text, 'abyss'::text, 'candy'::text, 'gold'::text, 'egyptian'::text$old$,
      $new$'xadria'::text, 'wild'::text, 'celestial'::text, 'abyss'::text, 'candy'::text, 'gold'::text, 'egyptian'::text, 'insects'::text$new$);
    execute definition;
  end loop;
end;
$$;

commit;
