---
name: paid-booking-readiness
description: Specify and verify LVL Up's date selection, capacity, account options, and payment-first registration without confusing the current localStorage demo for a production booking backend.
---
# LVL Up paid booking readiness

Use when editing calendar, checkout, athlete accounts, capacity, refunds, booking receipts or registration notifications.

## Canonical baseline
Read `README.md`, `AUTH_SETUP.md`, `supabase-schema.sql`, existing page scripts, and the actual branch. The current account is a browser-only localStorage demonstration and should never be advertised as secure authentication.

## Decisions to preserve
- Venue: The Annex; one court; **18 participants per training date**.
- Guest checkout should be supported; accounts are optional and unlock saved details, payment history and session history.
- The intended policy is **successful payment before a seat becomes confirmed**.
- A display-only calendar or temporary client-side count is not authoritative inventory. Never hardcode payment-success in client JS.

## Specification gate (inspired by Elephant Goldfish)
Write a brief, options, a traceable implementation design and an acceptance matrix for:
1. Session inventory/seat capacity with concurrent requests; reservation hold expiration, idempotency, payment webhooks and reconciliation.
2. Paid, pending, failed, refunded, cancelled, expired and waitlisted state transitions, including no oversell at 18 and no unpaid confirmed seat.
3. Guest-to-account linking without duplicated bookings or leaked attendee information.
4. Guardian consent and age-appropriate booking requirements, receipts and privacy/access controls.
5. Approved cancellation policy, refund terms, taxes/fees, coach overrides and no-show handling.
6. Hosted payment-provider flow rather than storing card numbers in this application.

Independently challenge the design in a fresh isolated agent context only if real independent agents are available; otherwise clearly state that independent review was **not performed**.

## Browser verification (agent-browser if installed)
Use a real browser and disposable sandbox data to verify calendar dates, full sessions, sign-in, guest purchase, payment error/cancel/retry, accessibility, mobile viewports, session history, and a double-booking race. Screenshots of client-side demos are **not** proof of server authority or payment settlement. Do not use real payment cards or charge actual users.

## Delivery gate
Implement only after owner approval of payment provider, policies, backend environment and data model. Work on a branch, run actual checks, open a draft PR and stop before merging. No live checkout, production billing, secret provisioning, or deployment without authorization.

Attribution: Original project-local workflow inspired by https://github.com/google/elephant-goldfish-model (Apache-2.0), https://github.com/vercel-labs/agent-browser and test-first development patterns. No third-party tools are installed automatically.
