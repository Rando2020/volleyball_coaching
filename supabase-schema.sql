-- LVL Up Volleyball production account schema for Supabase/PostgreSQL
-- Run this only in a Supabase project you control.

create extension if not exists "pgcrypto";

create type public.profile_role as enum ('player', 'parent', 'coach', 'team_organizer', 'admin');
create type public.profile_visibility as enum ('private', 'coach_only');
create type public.goal_status as enum ('active', 'completed', 'paused');
create type public.session_status as enum ('requested', 'confirmed', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  role public.profile_role not null default 'player',
  age_range text,
  volleyball_experience text,
  primary_position text,
  primary_focus text,
  guardian_name text,
  guardian_email text,
  visibility public.profile_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_access (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (athlete_id, coach_id)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  measurement text,
  status public.goal_status not null default 'active',
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.badge_definitions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  level_number integer not null check (level_number between 1 and 5),
  display_order integer not null default 0
);

create table public.profile_badges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badge_definitions(id) on delete cascade,
  awarded_by uuid references public.profiles(id) on delete set null,
  note text,
  awarded_at timestamptz not null default now(),
  unique (profile_id, badge_id)
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  service_type text not null,
  status public.session_status not null default 'requested',
  starts_at timestamptz,
  duration_minutes integer,
  location text,
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coaching_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.training_sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  current_focus text,
  observation text not null,
  next_action text not null,
  verification_plan text,
  created_at timestamptz not null default now()
);

create table public.mechanics_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  skill text not null,
  workload_context text,
  visible_pattern text,
  coaching_priority text,
  lower_stress_progression text,
  medical_referral_recommended boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.badge_definitions (code, name, description, level_number, display_order)
values
  ('F', 'Foundation', 'Builds understandable and repeatable movement.', 1, 1),
  ('R', 'Reliable', 'Delivers the skill consistently enough for teammates to build around it.', 2, 2),
  ('C', 'Competitive', 'Makes useful decisions at game speed and recovers after mistakes.', 3, 3),
  ('T', 'Teammate', 'Communicates, stays playable, and responds to frustration constructively.', 4, 4),
  ('L', 'Leader', 'Raises the standard while making others more capable and confident.', 5, 5)
on conflict (code) do nothing;

alter table public.profiles enable row level security;
alter table public.coach_access enable row level security;
alter table public.goals enable row level security;
alter table public.profile_badges enable row level security;
alter table public.training_sessions enable row level security;
alter table public.coaching_feedback enable row level security;
alter table public.mechanics_reviews enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can manage their own goals"
  on public.goals for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "Users can read their own badges"
  on public.profile_badges for select
  using (auth.uid() = profile_id);

create policy "Users can read their own sessions"
  on public.training_sessions for select
  using (auth.uid() = profile_id or auth.uid() = coach_id);

create policy "Users can request their own sessions"
  on public.training_sessions for insert
  with check (auth.uid() = profile_id);

create policy "Users can read their own feedback"
  on public.coaching_feedback for select
  using (auth.uid() = profile_id or auth.uid() = coach_id);

create policy "Users can read their own mechanics reviews"
  on public.mechanics_reviews for select
  using (auth.uid() = profile_id or auth.uid() = coach_id);

-- Coach write policies should be added only after the coach/admin role model is finalized.
-- Do not expose service-role credentials in browser code.
