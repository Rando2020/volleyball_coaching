# Paid checkout implementation decisions
User chose optional accounts with guest checkout on October 30.
- Retain Annex calendar and its 18-seat database constraint.
- Require provider-verified payment; no browser-only confirmation.
- Use Stripe hosted checkout and optional saved methods for authenticated members.
- Retain a temporary seat while payment can still complete; release only on authoritative expiry.
- Member history comes from verified account ownership, never an email lookup.
- Keep refund tracking separate from cancellation policy.
- Deliver code and tests in a stacked review PR. No live keys, real dates/prices, migrations or deployment.
- Sandbox timing defaults: 35-minute checkout, no new checkout within 36 minutes of start.
- Live launch requires provider setup/acceptance, durable reconciliation, abuse controls and confirmed policies.
