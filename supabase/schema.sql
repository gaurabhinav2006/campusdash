-- Run this in the Supabase SQL Editor.
-- This migration keeps one row per unique name and only replaces that row
-- when the player achieves a higher score. Never use a secret/service_role
-- key in the browser.

create extension if not exists citext;

create table if not exists public.campus_scores (
  name citext primary key check (char_length(name) between 1 and 18),
  score integer not null check (score between 0 and 1000000000),
  distance integer not null check (distance between 0 and 1000000000),
  coins integer not null check (coins between 0 and 1000000000),
  created_at timestamptz not null default now()
);

-- Remove policies from the previous table shape before changing the name
-- column. PostgreSQL will not alter a column used by a policy definition.
drop policy if exists "Public can read campus scores" on public.campus_scores;
drop policy if exists "Public can submit campus scores" on public.campus_scores;

-- Migrate the earlier table shape if it still has an identity id column.
-- Duplicate names are reduced to the highest existing score before the
-- primary key is added. If there are no old rows, these statements are safe.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'campus_scores'
      and column_name = 'id'
  ) then
    with ranked as (
      select ctid,
             row_number() over (
               partition by lower(name::text)
               order by score desc, created_at asc
             ) as row_number
      from public.campus_scores
    )
    delete from public.campus_scores as scores
    using ranked
    where scores.ctid = ranked.ctid
      and ranked.row_number > 1;

    alter table public.campus_scores drop constraint if exists campus_scores_pkey;
    alter table public.campus_scores drop column if exists id;
  end if;

  alter table public.campus_scores
    alter column name type citext using name::citext;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.campus_scores'::regclass
      and contype = 'p'
  ) then
    alter table public.campus_scores add primary key (name);
  end if;
end $$;

create index if not exists campus_scores_score_idx
  on public.campus_scores (score desc, created_at asc);

alter table public.campus_scores enable row level security;

create policy "Public can read campus scores"
  on public.campus_scores for select
  to anon, authenticated
  using (true);

-- Scores are submitted through the guarded RPC below, not direct table writes.
revoke insert, update, delete on table public.campus_scores from anon, authenticated;
grant select on table public.campus_scores to anon, authenticated;
grant usage on schema public to anon, authenticated;

create or replace function public.submit_campus_score(
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
