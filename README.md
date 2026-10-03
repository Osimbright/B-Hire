# B-Hire — freelance marketplace

A freelance marketplace built with **Next.js 16 (App Router)**, **Tailwind CSS v4** and
**Supabase**. Clients post jobs and hire; freelancers send proposals; both sides chat one-on-one,
about a job or directly from a freelancer's profile, and leave reviews when the work is done.

> The brand name lives in one place: `src/lib/config.ts` → `APP_NAME`.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. You'll need the Supabase setup below first.

## Supabase setup

**1. Environment.** Copy `.env.example` to `.env.local` and fill in the two values from
Dashboard → Project Settings → API Keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Only the publishable key is ever needed — the app has no server-only key, because every rule
that matters is enforced by row-level security in the database.

**2. Schema.** Every migration in `supabase/migrations/` needs to run, oldest first (the file
names start with their date):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Or paste each file into Dashboard → SQL Editor and run them oldest first.

**3. Signup.** Under Authentication → Sign In / Providers → Email, turn **Confirm email** off
for local development, or signup will wait on a confirmation link before giving you a session.
Turn it back on before launching — `signup()` in `src/actions/auth.ts` already handles both.

## Features

| | Client | Freelancer |
|---|---|---|
| Dashboard home | My jobs + status + proposal counts | Browse/search open jobs |
| Core action | Post a job (title, description, category, budget, deadline) | Submit a proposal (cover note + bid) |
| Hiring | View proposals per job, **accept one** → job becomes *In progress* | Track proposals (Pending / Accepted / Not selected) |
| Finishing | **Mark the job complete**, then rate and review the freelancer | Reviews show on their profile and the landing page |
| Profiles | Browse freelancer profiles; edit own profile: logo or picture, headline, company, website, location, bio | Edit own profile: picture, headline, location, availability, skills and languages (as tags), hourly rate, bio, portfolio links |
| Messaging | Chat with each applicant per job, or **message any freelancer from their profile** | Chat with the client per job; reply to clients who message directly |
| Files in chat | Pictures, videos and documents up to 50 MB | Same |

## How it works

- **`src/lib/db.ts`**: the only file that talks to the database. Every page and server action
  reads and writes through it.
- **`src/lib/auth.ts`**: `getCurrentProfile()` / `requireProfile(role)`, called at the top of
  every dashboard page and server action. The session itself is Supabase's, in httpOnly cookies.
- **`src/proxy.ts`** (Next 16's renamed middleware) refreshes the session on every dashboard and
  auth request, sends logged-out users on `/dashboard/*` to `/login`, and sends logged-in users
  to the dashboard for their role.
- **`src/actions/`**: server actions for auth, jobs, proposals, profile, messages and contact.

```
supabase/migrations/            Schema, RLS, triggers and functions
src/lib/supabase/               Server, browser and proxy clients
src/proxy.ts                    Session refresh + auth/role redirects
src/lib/db.ts                   Every query in the app
src/lib/auth.ts                 getCurrentProfile() / requireProfile(role)
src/actions/                    Server actions
src/components/                 UI kit, top bar, forms, chat
src/app/(auth)/                 /login, /signup
src/app/dashboard/client/       My jobs, post job, job proposals, browse freelancers, profile
src/app/dashboard/freelancer/   Find work, job + proposal form, my proposals, profile
src/app/dashboard/messages/     Conversation list + chat (job chats and direct/ chats)
```

## Security model

Authorisation lives in the database, not in the app:

- **Row-level security** on every table. A signed-out visitor can read nothing; a signed-in user
  sees open jobs, their own rows, and the conversations they belong to.
- **Profiles** are created by the `on_auth_user_created` trigger from signup metadata. `id`,
  `role` and `email` can never be changed from the app — only the editable profile fields are
  granted, and `email` isn't readable by other users at all.
- **`accept_proposal()`** does the accept/decline/hire in one transaction with row locks, so two
  simultaneous accepts can't both win. **`complete_job()`** only lets the job's client finish a
  job they've hired for, and a review can only be left on your own completed job.
- **Direct messages**: only the two people can read them, and only the client can start one —
  a freelancer can reply once the client has written, but can't cold-message clients.
- **Storage**: chat files sit in a private bucket that only the two people in that conversation
  can read; profile pictures sit in a public bucket where each user can only write to their own
  folder.
- **`security definer` functions** are the only way past the table policies, and each returns a
  narrowed, read-only view: marketplace counters and testimonials for the public landing page,
  and the freelancer directory, whose track record spans jobs the viewer isn't allowed to read.

## Known gaps

None of these break anything; they're improvements for later.

- **Chat polls every 3 seconds.** New messages show up within a few seconds rather than
  instantly. Realtime is enabled on `messages` in the schema and `src/lib/supabase/client.ts` is
  ready for it, but the chat component still polls.
- **Direct messages aren't in the landing page's reply-time numbers.** `landing_metrics()` only
  counts job conversations, so "replies within …" and "active freelancers" ignore direct chats.
- **Landing page reviews show initials, not profile pictures.** The reviews on the freelancer
  profile page show pictures; the landing page's would need `landing_metrics()` to return them.
