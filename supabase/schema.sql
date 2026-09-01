create extension if not exists "pgcrypto";

create type public.mission_status as enum (
  'locked',
  'hint',
  'location_revealed',
  'revealed',
  'completed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  mission_date date not null,
  meeting_time time,
  meeting_place text,
  hint text,
  dress_code text,
  budget integer check (budget is null or budget >= 0),
  full_description text,
  status public.mission_status not null default 'locked',
  reveal_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index missions_user_id_idx on public.missions(user_id);
create index missions_publication_idx on public.missions(user_id, is_published, mission_date);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.missions enable row level security;

-- PostgreSQL privileges allow authenticated requests to reach RLS. The RLS
-- policies below still decide which rows each user may read or change.
revoke all on table public.profiles from anon;
revoke all on table public.missions from anon;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.missions to authenticated;

create policy "Users can read their own profile"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "Admins manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "Users read assigned published missions"
on public.missions for select
using ((user_id = auth.uid() and is_published) or public.is_admin());

create policy "Admins create missions"
on public.missions for insert
with check (public.is_admin());

create policy "Admins update missions"
on public.missions for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admins delete missions"
on public.missions for delete
using (public.is_admin());

-- After creating the first account, promote it once in the Supabase SQL editor:
-- update public.profiles set role = 'admin' where email = 'admin@example.com';
