# Optional accounts update

Payment now supports guests. Google/Apple accounts are optional and add member history and optional saved payment methods. Apply the payment upgrade only in an approved sandbox; see [PAYMENT_SETUP.md](PAYMENT_SETUP.md). Existing guest bookings are not automatically linked by email. Payment operations accept only verified, non-anonymous account tokens when signing in.

# Google and Apple sign-in
The booking page has a Supabase Auth adapter but **no enabled providers or credentials**. It displays an unavailable message, not pretend login buttons. The old account.html demo does not authenticate anyone.

## Minimum integration
1. Use a business-owned Supabase project. Approval is required before applying booking-schema.sql. Do not run the unrelated legacy supabase-schema.sql as a booking dependency.
2. Set Supabase Site URL and exact redirect allowlist entries for approved origins, including the deployed path to index.html. The browser uses PKCE and the SDK's callback detection and session exchange.
3. **Google:** configure a Web OAuth client and consent screen in Google Cloud. Add the Supabase /auth/v1/callback URL as an authorized redirect URI and approved website origins. Store the client ID/secret in Supabase's Google provider settings.
4. **Apple:** requires an Apple Developer account, a Sign in with Apple-enabled App ID, associated Services ID, verified web domain/return URL and signing key. Configure Apple's provider in Supabase. Maintain web OAuth client secret rotation at least every six months. Never publish the .p8 key or client secret.
5. Put only the Supabase URL and **publishable** sb_publishable_... key in booking-config.json. Never use secret/service-role credentials. Add "google" and/or "apple" to providers only after each provider is configured and tested. An empty list exposes no provider buttons.
6. Run npm ci and npm run build to produce the pinned browser SDK at dist/supabase.js. Include it with static hosting. Auth is not provided by the hosting platform.
7. Test redirect completion, denial, logout, expired sessions, disabled provider errors, registration after login, returning user status, and two independent accounts in staging. Provider configuration cannot be validated by simulated tests.

## Identity and participant name
The database uses auth.uid(), not browser-submitted account IDs. Anonymous Supabase users cannot register. The form collects a participant name explicitly, since Apple's web flow may not provide one. This increment supports one participant per authenticated account per training day. Guardian/dependent and group registration are not implemented; finalize eligibility and consent before opening sessions.

## Current limitations
The SDK persists real auth sessions using its standard browser storage; legacy demo profiles are ignored. Existing profile/badge UI remains a demo. Authentication does not establish age, guardian consent or a coaching relationship.

Official references checked during implementation:
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/social-sign-in/auth-apple
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/database/functions
