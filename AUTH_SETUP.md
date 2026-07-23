# LVL Up Account Rollout

The repository now includes a polished browser-only account demo and a production database schema. The demo is intentionally labeled as a demo because localStorage is not secure authentication.

## Current demo behavior

- Visitors can open `account.html` from the homepage navigation.
- Visitors can create one demo profile in their current browser.
- The profile includes role, age range, experience, position, focus, goal, guardian fields, badge level, and a dashboard preview.
- No password is stored or verified.
- No information is sent to a server.
- Clearing browser storage removes the demo profile.

## Recommended production stack

Use Supabase for the first production release:

- Supabase Auth for email/password and password-reset flows
- PostgreSQL for profiles, goals, sessions, badges, feedback, and mechanics reviews
- Row Level Security for profile privacy
- Supabase Storage later for approved video uploads and profile images
- A server-side or edge function for coach/admin actions

The database starting point is in `supabase-schema.sql`.

## Production implementation sequence

1. Create a Supabase project owned by the LVL Up business account.
2. Run `supabase-schema.sql` in the SQL editor.
3. Configure the site URL and approved redirect URLs.
4. Add a public Supabase URL and anonymous key through deployment environment variables.
5. Replace the localStorage adapter in `account.js` with Supabase Auth and table queries.
6. Add email verification and password reset.
7. Add a protected coach/admin dashboard.
8. Add guardian-managed profiles for minors.
9. Add session requests, confirmations, cancellation rules, and reminders.
10. Add video upload only after storage limits, consent, deletion, and access rules are defined.

## Roles

### Athlete

- View and edit own profile
- Manage goals
- View own badges, sessions, feedback, and mechanics reviews
- Request training

### Parent or guardian

- Manage approved dependent profiles
- Book and pay for youth sessions
- View feedback shared with the dependent profile

### Coach

- View only athletes who explicitly grant access
- Create coaching notes, feedback, session records, and badge awards
- Never access unrelated athlete profiles

### Admin

- Manage service definitions, pricing, coach roles, badge definitions, and account support
- Use server-side permissions rather than browser-only role checks

## Required safeguards before launch

- Privacy policy and terms of service
- Explicit guardian flow for minors
- Consent language for video and image uploads
- Account deletion and data-export process
- Data-retention rules
- Role-based access testing
- Rate limiting and bot protection on registration and password reset
- No medical records or diagnostic claims inside mechanics reviews
- No service-role or private API keys in client-side files

## Pragmatic launch plan

### Phase 1

Use the current profile demo for stakeholder review and user testing. Keep booking through the existing contact workflow.

### Phase 2

Connect Supabase Auth, profiles, goals, and badges. Keep session scheduling manual.

### Phase 3

Add coach notes, session history, guardian-managed youth profiles, and protected video review.

### Phase 4

Add payments, automated scheduling, reminders, and deeper progress reporting only after real demand proves those workflows are needed.
