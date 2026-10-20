-- DESTRUCTIVE RESET: this deletes every existing campus score.
-- Use schema.sql first if you want to preserve existing scores.

create extension if not exists citext;

drop function if exists public.submit_campus_score(text, integer, integer, integer);
drop table if exists public.campus_scores cascade;

create table public.campus_scores (
  name citext primary key check (char_length(name) between 1 and 18),
  score integer not null check (score between 0 and 1000000000),
  distance integer not null check (distance between 0 and 1000000000),
  coins integer not null check (coins between 0 and 1000000000),
  created_at timestamptz not null default now()
);

create index campus_scores_score_idx
  on public.campus_scores (score desc, created_at asc);

alter table public.campus_scores enable row level security;

create policy "Public can read campus scores"
  on public.campus_scores for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on table public.campus_scores from anon, authenticated;
grant select on table public.campus_scores to anon, authenticated;
grant usage on schema public to anon, authenticated;

create function public.submit_campus_score(
  p_name text,
  p_score integer,
  p_distance integer,
  p_coins integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(trim(p_name)) not between 1 and 18
     or p_score not between 0 and 1000000000
     or p_distance not between 0 and 1000000000
     or p_coins not between 0 and 1000000000 then
    raise exception 'Invalid campus score payload';
  end if;

  insert into public.campus_scores (name, score, distance, coins)
  values (trim(p_name)::public.citext, p_score, p_distance, p_coins)
  on conflict (name) do update
    set score = excluded.score,
        distance = excluded.distance,
        coins = excluded.coins,
        created_at = now()
    where excluded.score > public.campus_scores.score;
end;
$$;

revoke all on function public.submit_campus_score(text, integer, integer, integer)
  from public;
grant execute on function public.submit_campus_score(text, integer, integer, integer)
  to anon, authenticated;
