-- REVIEW ONLY. Apply to a staging database only after approval.
-- Independent of the legacy profile demo schema; do not run that schema for booking.
begin;
create schema if not exists booking_private;
revoke all on schema booking_private from public;
grant usage on schema booking_private to anon, authenticated;

create table public.annex_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 160),
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  training_day date generated always as ((starts_at at time zone 'America/Chicago')::date) stored,
  capacity integer not null default 18 check (capacity = 18),
  venue text not null default 'Annex' check (venue = 'Annex'),
  courts integer not null default 1 check (courts = 1),
  status text not null default 'closed' check (status in ('open','closed','cancelled')),
  unique (training_day)
);
create table public.annex_registrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.annex_sessions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  attendee_name text not null check (length(btrim(attendee_name)) between 1 and 120),
  seat integer not null check (seat between 1 and 18),
  created_at timestamptz not null default now(),
  unique (session_id, user_id),
  unique (session_id, seat)
);
alter table public.annex_sessions enable row level security;
alter table public.annex_registrations enable row level security;
-- RPC-only API: no direct table access, including default Supabase grants.
revoke all on public.annex_sessions, public.annex_registrations from public, anon, authenticated;

-- The privileged implementation is not in a Data API-exposed schema.
create function booking_private.register_annex_session(p_session_id uuid, p_attendee_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.annex_sessions%rowtype;
  v_registration uuid;
  v_seat integer;
begin
  if v_user is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'AUTH_REQUIRED' using errcode='42501';
  end if;
  if p_attendee_name is null or length(btrim(p_attendee_name)) not between 1 and 120 then
    raise exception 'NAME_REQUIRED' using errcode='22023';
  end if;
  select * into v_session from public.annex_sessions where id=p_session_id for update;
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode='P0002'; end if;
  select id into v_registration from public.annex_registrations where session_id=p_session_id and user_id=v_user;
  -- Idempotent retry after an ambiguous network response. Never creates a second seat.
  if v_registration is not null then
    return jsonb_build_object('status','confirmed','session_id',p_session_id,'registration_id',v_registration);
  end if;
  if v_session.status <> 'open' or v_session.starts_at <= clock_timestamp() then
    raise exception 'SESSION_CLOSED';
  end if;
  select n into v_seat from generate_series(1,18) n
    where not exists (select 1 from public.annex_registrations r where r.session_id=p_session_id and r.seat=n)
    order by n limit 1;
  if v_seat is null then raise exception 'SESSION_FULL'; end if;
  insert into public.annex_registrations(session_id,user_id,attendee_name,seat)
    values(p_session_id,v_user,btrim(p_attendee_name),v_seat) returning id into v_registration;
  return jsonb_build_object('status','confirmed','session_id',p_session_id,'registration_id',v_registration);
end;
$$;
revoke all on function booking_private.register_annex_session(uuid,text) from public, anon, authenticated;
grant execute on function booking_private.register_annex_session(uuid,text) to authenticated;

create function public.register_annex_session(p_session_id uuid, p_attendee_name text)
returns jsonb language sql security invoker set search_path = '' as $$
  select booking_private.register_annex_session(p_session_id,p_attendee_name);
$$;
revoke all on function public.register_annex_session(uuid,text) from public, anon, authenticated;
grant execute on function public.register_annex_session(uuid,text) to authenticated;

-- Public schedule aggregates contain no names, emails, user IDs or reservation IDs.
create function booking_private.list_annex_sessions()
returns table(id uuid,title text,description text,starts_at timestamptz,ends_at timestamptz,status text,capacity integer,registered integer,is_registered boolean)
language sql stable security definer set search_path = '' as $$
  select s.id,s.title,s.description,s.starts_at,s.ends_at,s.status,s.capacity,
    (select count(*)::integer from public.annex_registrations r where r.session_id=s.id),
    exists(select 1 from public.annex_registrations r where r.session_id=s.id and r.user_id=auth.uid())
  from public.annex_sessions s order by s.starts_at;
$$;
revoke all on function booking_private.list_annex_sessions() from public, anon, authenticated;
grant execute on function booking_private.list_annex_sessions() to anon, authenticated;
create function public.list_annex_sessions()
returns table(id uuid,title text,description text,starts_at timestamptz,ends_at timestamptz,status text,capacity integer,registered integer,is_registered boolean)
language sql stable security invoker set search_path = '' as $$
  select * from booking_private.list_annex_sessions();
$$;
revoke all on function public.list_annex_sessions() from public, anon, authenticated;
grant execute on function public.list_annex_sessions() to anon, authenticated;
commit;
