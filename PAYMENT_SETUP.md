# Paid guest checkout and optional member accounts
This is a **sandbox-only integration**, disabled by default. No live keys, money movement, production SQL or deployment were used. It is stacked on the Annex calendar work.

## User flow
Guests enter participant name and receipt email, then pay using hosted Stripe Checkout. No account is required. Members sign in first to keep future booking/payment history and optionally save a payment method with Stripe. The application never handles card numbers.

A private, random request token stays in sessionStorage for guest checkout retry and confirmation. The server stores its hash. Tokens are not placed in URLs. Guest status does not disclose attendee names or emails. Closing the tab or clearing storage loses this convenience; the Stripe receipt and coach support remain the recovery route. Guest purchases are not automatically claimed by an account with a matching email. Secure cross-device guest claiming is a later feature.

Only a verified server/provider payment result yields confirmation. Browser redirects, query strings, local profiles and client-submitted amounts cannot mark a registration paid. An invalid login token cannot silently become a guest purchase.

## Seat and payment lifecycle
- The server locks the training-day row and allocates one of the existing 18 unique seats.
- Pending checkout holds count toward capacity. Each account/email can have one active booking per day.
- Price and title are captured from the database. A missing price prevents checkout. USD is the current supported currency; amounts are integer cents. No actual prices have been entered.
- Stripe creation uses a stable idempotency key, allowing retries after uncertain responses without making a second checkout.
- Sandbox checkout expires after 35 minutes. New checkout closes 36 minutes before the start, keeping the payment window before the session. These timing defaults can be revised before launch.
- Closing or cancelling a session causes reconciliation to expire its pending Stripe checkouts. A payment that already completed remains recorded for coach review, without inventing an automatic refund policy.
- Only verified Stripe expiry releases an unpaid seat. A browser timer cannot release it.
- Signed webhook notifications and the return/status endpoint retrieve current Stripe state, validate checkout ID, metadata, amount, currency and test mode, then persist the result.
- Duplicate and out-of-order events do not regress a paid booking.
- Refund notifications record refunded amounts. Full refunds are labeled refunded but retain the seat pending a coach's cancellation decision. No automatic refund or cancellation policy is assumed.
- Old unpaid registrations are explicitly labeled legacy. They are not relabeled paid. The old browser-callable registration function loses execute access when the payment upgrade is applied.

## Sandbox setup, only after authorization
1. Use a fresh sandbox Supabase project. Apply booking-schema.sql, then payment-schema.sql after approval. Run database security advisors. These are reviewable one-time SQL scripts, not applied migrations.
2. Insert only confirmed dates and explicit prices in public.annex_sessions. Existing sessions remain unpriced. Use the closed status until ready.
3. Copy .env.example to a local ignored env file. Set PAYMENTS_ENABLED=test and provide a Stripe sk_test_ key, webhook whsec_ secret, server-only database connection, Supabase URL/publishable key, and SITE_URL ending in a slash.
4. Configure the browser's booking-config.json with the same Supabase project and only public values. Configure Google/Apple per AUTH_SETUP.md if member access is desired. Guests use public schedule access.
5. Install and run:
~~~sh
npm ci
npm run build
node --env-file=.env server/app.mjs
~~~
6. Forward signed Stripe test events to /api/payments/webhook. Subscribe to checkout.session.completed, checkout.session.expired, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed and charge.refunded. Card payments are the deliberately selected initial method family; delayed bank payments are not enabled.
7. Configure Stripe's test customer portal to allow payment-method management. Member Checkout exposes an optional save-card control. Saving a card is not consent to charge future drills automatically.
8. Test real Stripe test checkout, decline, 3-D Secure, abandonment, two browser sessions racing for the final seat, webhook retry, member card saving/removal, receipts and refund display. Local tests use a fake provider and do not replace these steps.

The server is a portable Node process, bound to localhost. Static-only hosting cannot serve payment APIs. Sandbox hosting needs the Node service and an approved HTTPS reverse proxy on the same origin. The server exposes only a static-file allowlist and JSON endpoints; SQL, credentials and server source are not served.

## Reconciliation and operational limits
The sandbox process reconciles up to 100 pending rows every minute. It retains unresolved holds if Stripe cannot be reached. An unattached hold older than five minutes requires investigation: do not free it until Stripe confirms that no payable session exists. A successful provider request followed by a database outage is recovered by the stable idempotency key or signed webhook. Error logs identify the need for review without logging names, tokens or credentials.

Before live operation, add a durable scheduled reconciliation job, monitoring/alerts, distributed abuse protection for guest holds, secure guest recovery, approved refund/cancellation rules, finalized prices and a real end-to-end acceptance run. The included rate limiter is single-process sandbox protection. The runtime explicitly rejects live Stripe keys/events. Live activation is a separate reviewed change.

## Account scope
Member history includes upcoming and past registrations, payment/refund state and receipt links. It is not an attendance record. Saved cards remain with Stripe, and the customer portal opens only for the verified account's mapped Stripe Customer. Existing demo profiles remain unrelated to authentication.

## Validation
npm test covers validation, live-key blocking, signature verification, origin checks and identity handling.
npm run test:db applies both SQL scripts in a disposable database, tests guest capacity, pricing, retries, state transitions, refunds, privacy and the blocked unpaid RPC. With DATABASE_URL it uses concurrent PostgreSQL connections; without it, embedded tests serialize.
npm run test:browser tests guest checkout/return, no premature confirmation, retry behavior, member history, mobile widths and the actual Supabase SDK adapter against mocked HTTP endpoints.

Never point the database tests at Supabase or any database containing real data.
