# LVL Up Volleyball

A responsive volleyball coaching website for athletes of all ages, parents, teams, and coaches in the Milwaukee area, with remote video and coach consultation options.

## Included

- LVL Up branded landing page
- Regulation-proportioned volleyball court graphics
- Private, group, team, mechanics, video-review, and coach-development services
- Transparent pricing and community-rate sessions
- Accountability, team culture, and badge progression framework
- Expanded contact and training intake form
- Mobile navigation and scroll-driven motion
- Reduced-motion accessibility support
- Demo sign-in and create-profile experience
- Demo athlete or coach dashboard with goals, badges, current focus, and session placeholders
- Production Supabase/PostgreSQL schema and authentication rollout guide

## Account experience

Open `account.html` to test the profile flow.

The current account experience is a front-end demo:

- It stores one profile in the current browser with localStorage.
- It does not transmit data.
- It does not securely authenticate a user.
- It does not store or verify passwords.
- It is intended for design review and workflow testing.

See `AUTH_SETUP.md` and `supabase-schema.sql` for the secure production path.

## Run locally

No build tools are required.

```bash
python -m http.server 8080
```

Open:

- Main website: `http://localhost:8080`
- Account demo: `http://localhost:8080/account.html`

## Before public launch

1. Replace `coachziahvolleyball@gmail.com` if a different business email will be used.
2. Connect a scheduling tool or a custom booking backend.
3. Connect secure authentication before presenting profiles as real accounts.
4. Add privacy, terms, cancellation, consent, and guardian policies.
5. Test the complete site on real phones, tablets, and desktop browsers.
6. Add original coaching photography and testimonials only with written permission.
7. Add payments after cancellation, refund, community-rate, and court-rental rules are finalized.

## Hosting

The public marketing site and demo profile can be deployed directly through GitHub Pages, Netlify, Cloudflare Pages, or Vercel. Real accounts require a connected backend such as Supabase.
