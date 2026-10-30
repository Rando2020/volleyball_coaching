# LVL Up: Annex booking
Mobile calendar for the confirmed Annex venue: one court, maximum 18 participants per training day. Existing LVL branding and coaching content are retained.

## Current branch
- Optional-account guest checkout. Successful payment is required for confirmation.
- Members can see booking/payment history and receipts, and optionally save payment methods with Stripe.
- Dates and prices are intentionally unset.
- Payments are disabled by default. The included Node runtime accepts Stripe test keys only.
- No production SQL, deployment or live payment activation has been performed.
- The old account.html profile demo remains separate from real accounts.

## Run
Node 22+:
~~~sh
npm ci
npm run build
npm start
~~~
Open http://localhost:8080. Without backend configuration, the calendar uses sessions.json for schedule display only and shows registration as unavailable. Static hosting can display the calendar but cannot provide payment APIs.

Read [PAYMENT_SETUP.md](PAYMENT_SETUP.md) for payment lifecycle, sandbox environment, SQL review, operational limits and activation requirements. Read [AUTH_SETUP.md](AUTH_SETUP.md) for Google/Apple configuration.

## Capacity and payment integrity
One database row per Chicago training date. Registration and checkout holds use the same 18 unique numbered seats. A row lock serializes competing purchases. Duplicate retries reuse the existing checkout. Prices come from the database, and only verified Stripe state can confirm payment or release expired holds. The old unpaid registration RPC is revoked by the payment SQL upgrade.

Guest confirmation uses a private random token. Member history is restricted to authenticated account ownership. Guest orders are not attached to accounts merely because emails match. Cards are handled by Stripe.

## Checks
~~~sh
npm test
npm run build
npm run test:db
npx playwright install chromium
npm run test:browser
~~~
The browser suite starts its own disabled-payment Node server and mocks external HTTP services. Database tests use embedded PostgreSQL when DATABASE_URL is absent; requests are then serial. For real concurrent tests, use only a fresh disposable PostgreSQL database:
~~~sh
DATABASE_URL=postgresql://USER:PASSWORD@localhost/EMPTY_TEST_DATABASE npm run test:db
~~~
Never point tests at Supabase or real data. GitHub CI runs PostgreSQL 16, including 30 simultaneous guest checkout holds, exactly 18 accepted and 12 rejected.

## Before live activation
Confirm prices, dates, refund/cancellation and participant policies. Configure Stripe sandbox, Supabase and providers, run real end-to-end payment/auth tests, and approve database/deployment changes separately. Live operation also needs durable reconciliation, monitoring and guest abuse/recovery controls detailed in PAYMENT_SETUP.md.
