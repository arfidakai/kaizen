-- ============================================================
-- 1% Daily — Supabase Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USERS (extends auth.users) ────────────────────────────
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Trigger: auto-create user row on sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, username, avatar_url)
  values (
    new.id,
    split_part(new.email, '@', 1),
    null
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── HABITS ────────────────────────────────────────────────
create table if not exists public.habits (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text not null,
  icon       text default '✅',
  color      text default '#64dc78',
  created_at timestamptz default now()
);

alter table public.habits enable row level security;

create policy "Users can manage own habits"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── HABIT LOGS ────────────────────────────────────────────
create table if not exists public.habit_logs (
  id         uuid primary key default uuid_generate_v4(),
  habit_id   uuid not null references public.habits(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  date       date not null default current_date,
  completed  boolean not null default true,
  created_at timestamptz default now(),
  unique(habit_id, date)
);

alter table public.habit_logs enable row level security;

create policy "Users can manage own habit logs"
  on public.habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── JOURNAL ENTRIES ────────────────────────────────────────
create table if not exists public.journal_entries (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  date       date not null default current_date,
  mood       text,
  content    text not null,
  prompt     text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.journal_entries enable row level security;

create policy "Users can manage own journal entries"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── STREAKS ────────────────────────────────────────────────
create table if not exists public.streaks (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade unique,
  current_streak int default 0,
  best_streak    int default 0,
  last_active    date,
  updated_at     timestamptz default now()
);

alter table public.streaks enable row level security;

create policy "Users can manage own streaks"
  on public.streaks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: auto-create streak row for new user
create or replace function public.handle_new_user_streak()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.streaks (user_id, current_streak, best_streak)
  values (new.id, 0, 0);
  return new;
end;
$$;

drop trigger if exists on_user_created_streak on public.users;
create trigger on_user_created_streak
  after insert on public.users
  for each row execute procedure public.handle_new_user_streak();


-- ─── HELPER VIEWS ────────────────────────────────────────────

-- View: daily completion rate per user
create or replace view public.daily_completion as
select
  hl.user_id,
  hl.date,
  count(hl.id)::float / nullif((
    select count(*) from public.habits h2 where h2.user_id = hl.user_id
  ), 0) as rate
from public.habit_logs hl
where hl.completed = true
group by hl.user_id, hl.date;

-- ─── INDEXES ────────────────────────────────────────────────
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, date);
create index if not exists idx_journal_entries_user_date on public.journal_entries(user_id, date desc);
create index if not exists idx_habits_user on public.habits(user_id);

-- ─── THEME PREFERENCE ────────────────────────────────────────
-- Run this if you already have the users table and are adding theme support
alter table public.users add column if not exists theme text default 'forest';
