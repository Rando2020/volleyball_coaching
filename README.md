# LVL Up
A mobile-friendly, calendar-first training site. Annex is the confirmed venue: **one court, maximum 18 participants per training day**.

## Current status
- Calendar navigation, expandable details and registration status are implemented.
- No session dates are supplied. sessions.json intentionally contains an empty array.
- Google/Apple sign-in and live booking remain **unavailable until configured**.
- booking-schema.sql is a reviewable, unapplied database setup.
- Branding and coaching content are retained at coaching.html.
- account.html is an unrelated browser-only profile demo. It cannot reserve spots.

## Run
Node 22+ and Python 3:
~~~sh
npm ci
npm run build
python3 -m http.server 8080
~~~
Open http://localhost:8080. The disconnected calendar also works without the build. A connected backend requires generated dist/supabase.js; future hosting must run the build and serve that file.

## Configure training days
See [BOOKING_SETUP.md](BOOKING_SETUP.md) for the data contract, database design and staging steps. booking-config.json deliberately has no project credentials or enabled providers.

Static sessions.json is for confirmed schedule information only. Counts from it are ignored; it cannot register anyone. When connected, the database replaces the static schedule entirely.

## Capacity protection
One database row per Chicago training date. Row-locked registration assigns one of 18 unique seats. Constraints prevent overbooking even when displayed availability becomes stale. Duplicate requests from an account return the same registration. The client cannot write directly to tables or choose another user's ID. Only the server response can confirm a booking.

## Verification
~~~sh
npm test
npm run build
npm run test:db
npx playwright install chromium
python3 -m http.server 8080 --bind 127.0.0.1
# in another terminal
npm run test:browser
~~~
Without DATABASE_URL, database tests use disposable embedded PostgreSQL and serialize requests. For actual simultaneous connections, use **only a fresh disposable PostgreSQL database**:
~~~sh
DATABASE_URL=postgresql://USER:PASSWORD@localhost/EMPTY_TEST_DATABASE npm run test:db
~~~
The test creates auth stubs and roles; never target Supabase or production. The GitHub workflow supplies PostgreSQL 16 and runs 30 concurrent requests, requiring exactly 18 successes and 12 full-session rejections.

## Before activation
Approve staging/production SQL and deployment separately. Supply confirmed dates/times, configure providers, complete real OAuth and booking acceptance tests, and finalize participant eligibility, consent, privacy and cancellation rules. No payment integration is included.
