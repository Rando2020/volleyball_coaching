-- REVIEW ONLY: apply after booking-schema.sql in an approved sandbox.
begin;
alter table public.annex_sessions add column price_amount integer check (price_amount between 1 and 100000000);
alter table public.annex_sessions add column currency text not null default 'usd' check (currency = 'usd');
alter table public.annex_registrations alter column user_id drop not null;
alter table public.annex_registrations alter column seat drop not null;
alter table public.annex_registrations drop constraint annex_registrations_user_id_fkey;
alter table public.annex_registrations add foreign key(user_id) references auth.users(id) on delete set null;
alter table public.annex_registrations drop constraint annex_registrations_session_id_user_id_key;
alter table public.annex_registrations
  add column status text not null default 'legacy' check(status in ('legacy','pending','paid','expired','refunded','refund_pending')),
  add column email text,
  add column request_hash text unique,
  add column amount integer,
  add column checkout_title text,
  add column currency text,
  add column stripe_session_id text unique,
  add column checkout_url text,
  add column payment_intent_id text unique,
  add column receipt_url text,
  add column refunded_amount integer not null default 0 check(refunded_amount >= 0 and (amount is null or refunded_amount <= amount)),
  add column paid_at timestamptz,
  add column checkout_expires_at timestamptz,
  add constraint active_seat check (
    (status in ('legacy','pending','paid','refund_pending','refunded') and seat is not null)
    or (status in ('expired') and seat is null)),
  add constraint payment_details check(status='legacy' or
    (email is not null and request_hash is not null and amount > 0 and currency='usd'));
create unique index annex_active_account on public.annex_registrations(session_id,user_id)
  where status in ('legacy','pending','paid','refund_pending','refunded');
create unique index annex_active_email on public.annex_registrations(session_id,email)
  where status in ('pending','paid','refund_pending','refunded');
create table booking_private.payment_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null
);
alter table booking_private.payment_customers enable row level security;
revoke all on booking_private.payment_customers from public,anon,authenticated;
-- Shut the old unpaid registration route. Payment server is the only writer.
revoke all on function public.register_annex_session(uuid,text) from public,anon,authenticated;
revoke all on function booking_private.register_annex_session(uuid,text) from public,anon,authenticated;
drop function public.list_annex_sessions();
drop function booking_private.list_annex_sessions();
create function booking_private.list_annex_sessions()
returns table(id uuid,title text,description text,starts_at timestamptz,ends_at timestamptz,status text,capacity integer,registered integer,is_registered boolean,price_amount integer,currency text)
language sql stable security definer set search_path = '' as $$
select s.id,s.title,s.description,s.starts_at,s.ends_at,s.status,s.capacity,
 (select count(*)::integer from public.annex_registrations r where r.session_id=s.id and r.seat is not null),
 exists(select 1 from public.annex_registrations r where r.session_id=s.id and r.user_id=auth.uid() and r.status in ('paid','legacy')),
 s.price_amount,s.currency from public.annex_sessions s order by starts_at;
$$;
revoke all on function booking_private.list_annex_sessions() from public,anon,authenticated;
grant execute on function booking_private.list_annex_sessions() to anon,authenticated;
create function public.list_annex_sessions()
returns table(id uuid,title text,description text,starts_at timestamptz,ends_at timestamptz,status text,capacity integer,registered integer,is_registered boolean,price_amount integer,currency text)
language sql stable security invoker set search_path = '' as $$ select * from booking_private.list_annex_sessions(); $$;
revoke all on function public.list_annex_sessions() from public,anon,authenticated;
grant execute on function public.list_annex_sessions() to anon,authenticated;
commit;
