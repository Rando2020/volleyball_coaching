# Annex booking implementation
Scope authorized by the October 28 request. Retain static HTML and the existing navy, lime, blue, typography and LVL identity. Make the home page date-first; keep coaching content at coaching.html. No dates are assumed.

## Design
Use the existing Supabase direction rather than introduce a second booking service. Static JSON dates can be displayed before integration but never supply reservation counts. Once configured, PostgreSQL is authoritative for dates, counts and the account's registration. One record per America/Chicago date represents the one Annex court. Exactly 18 seats per record. One account registers once per day. Group/dependent booking and self-service cancellation are outside this increment; contact the coach for changes. This is an implementation scope, not an age eligibility policy.

Restricted database RPCs use authenticated identity, row locking and unique seat constraints. Duplicate retries return the existing booking. No attendee lists are publicly exposed. Supabase's pinned SDK handles PKCE. Providers remain hidden until explicitly configured.

## Implementation and checks
- [x] Calendar model: leap months, Chicago dates, invalid input, disconnected and full states.
- [x] Calendar UI and adapter: mobile, keyboard, empty/error/loading states, double submission, failed refresh and text injection.
- [x] Isolated SQL setup: simultaneous bookings, duplicate retries, direct-write restrictions, privacy, same-day uniqueness, closed/past dates and slot constraints.
- [x] Document provider setup and approval gates; run tests, review diff, open PR.
No production SQL, deployment or payments.

Local model, browser and embedded SQL checks passed. Multi-connection concurrency is enforced as a GitHub CI gate; external OAuth/staging acceptance remains required before activation.
