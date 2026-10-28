# Annex booking setup
**Review only. No production database changes or deployment are authorized by this change.**

## Schedule configuration
Until connected, edit sessions.json with confirmed sessions only. It is deliberately empty. Each record requires:

| Field | Value |
|---|---|
| id | Unique stable string (UUID in the database) |
| title | Session title |
| description | Plain text session details, level/eligibility and what to bring |
| starts_at, ends_at | Confirmed ISO 8601 timestamps with Z or explicit UTC offset |
| capacity | Exactly 18 |
| status | open, closed, or cancelled |

Dates use America/Chicago, including daylight saving. One session per training day is supported. A training day is the local date of its start time. No sample dates belong in the public schedule; test fixtures are isolated in tests/.

Static records never create reservations. Any registered or is_registered fields in JSON are discarded. Once configured, list_annex_sessions() replaces JSON entirely. Availability is a snapshot, refreshed on focus and after registration attempts; the transaction determines availability at submission.

## Database review
booking-schema.sql is independent of the old account schema. It contains no seeds and runs as one transaction. It is a one-time baseline, not an idempotent upgrade script. After approval:
1. Apply to fresh staging first and run Supabase database advisors.
2. Keep booking_private out of exposed Data API schemas; expose only the public RPC wrappers.
3. Review RLS and grants. Both tables have RLS enabled and no client grants. Public functions use security invoker. Private functions have empty search paths and narrow execute grants.
4. Insert confirmed schedule rows as a trusted administrator. Defaults are closed, Annex, one court and 18 seats. Open sessions only once eligibility and consent are ready.
5. Configure booking-config.json and authentication per AUTH_SETUP.md.
6. Verify staging RPC calls, RLS and concurrency before requesting production activation.

### Concurrency
Registration locks the session row, validates status/time, checks for an existing registration, then assigns an unused seat. Locks serialize requests on the same day. A unique (session_id, user_id) constraint makes retries idempotent. A unique (session_id, seat) constraint plus seat between 1 and 18 imposes the hard limit, including direct privileged writes. A unique generated Chicago date prevents splitting a day into multiple 18-seat sessions.

No public write operation accepts a user ID, count, seat number or capacity. Names must contain 1–120 trimmed characters. The schedule RPC returns totals and only the requesting account's boolean registration state, never other people's details.

### Operational scope
One account books one participant per day. No payments, waitlist, recurring generation, automatic cancellations or admin dashboard. For cancellation, contact the coach. After approval, a trusted operator can remove a registration to release its seat or mark a session cancelled. Changing a date after bookings requires a separate operational process and communication.

## Test boundaries
Embedded PostgreSQL exercises actual SQL, auth checks and constraints with one connection. The GitHub PostgreSQL service test exercises 30 simultaneous connections. Browser tests use a controlled API boundary for race/error scenarios; they do not prove provider setup or a real Supabase deployment. No remote database is contacted during local tests.
