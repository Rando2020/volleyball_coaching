# LVL Up skills integration (2026-11-01)

## Project-local skill
`.agents/skills/paid-booking-readiness/SKILL.md` is a project-specific specification and browser-validation procedure. The current site is still a demo for accounts; this change does **not** implement real authentication, payment processing or reliable seat inventory.

## Pilot acceptance scenario
- One court at The Annex, 18 seats per training date.
- Visitor selects a date and sees session price, location, date, capacity and policies.
- Visitor can purchase as a guest and receive a receipt, or sign into an account for booking history.
- **Only settled or otherwise verified successful provider payment transitions a registration into confirmed status.**
- Simultaneous requests for the final spot result in at most one confirmed registration.
- Cancel, failed-payment, retry, refund, waitlist and expired-hold scenarios have explicit rules.
- Coach/admin overrides are audited; minors use guardian-appropriate workflows.
- Existing localStorage profile data is never the authorization or payment source of truth.

## Validation and release plan
Design review first. Then inspect actual code and run sandbox test purchases with a chosen payment provider and a real backend on a dedicated preview environment. Verify webhooks and capacity in the database, not just in the browser. Introduce no live credentials, charges, or production deploys by default. Create a draft PR and obtain owner approval before merging.

## External tools
Possible upstream: Google Elephant Goldfish Model for spec work, Vercel agent-browser for browser QA. Review upstream scripts/permissions and version before installation. No external executable is introduced by this PR.
