# Venue Booking Web App

A full-stack hall booking system where guests submit booking requests and an admin reviews and approves or rejects them.

- **Stack:** Next.js 16 · TypeScript · Tailwind CSS · Supabase · React Hook Form · Zod v4

---

## What the App Does

### Guest flow (no account required)
1. Guest visits the landing page and browses venue information — capacity, amenities, time slot pricing, and guest packages.
2. Guest clicks **Venue Details** to view the full venue detail page.
3. Guest clicks **Book Your Event** and fills in the booking form: name, email, phone, event name, date, time slot, guest count (pax package), and optional notes. A live booking summary updates as they fill in the form.
4. On submission, the API creates a `pending` booking and returns a `reference_number`.
5. Guest is redirected to the confirmation page showing their reference number and full booking details.
6. A confirmation email is sent to the guest (requires Resend — see Environment Variables).
7. The admin is notified by email of the new booking (requires `ADMIN_NOTIFICATION_EMAIL` — see Environment Variables).

### Admin flow
1. Admin navigates to `/admin/dashboard` — the proxy intercepts and redirects to `/login` if not authenticated. If already logged in, `/login` redirects straight to the dashboard.
2. Admin logs in with email and password. Supabase sets a session cookie that persists across page loads.
3. Admin views all bookings on the dashboard. Each booking shows guest name, email, phone, event name, date, time, guest count, package, total price, and status.
4. Admin approves or rejects a `pending` booking. The guest receives a status update email.
5. Admin manages venue pricing (time slots and guest packages) from the **Venue Settings** page, accessible from the dashboard.

> Admin accounts are created manually in the Supabase dashboard.
> Set `app_metadata: { "role": "admin" }` on the user record to grant access.
> Only `pending` bookings can be actioned — approved/rejected bookings are final.

---

## Architecture

### File structure

```
src/
  app/
    api/v1/                   ← all API routes (versioned)
      auth/
        login/route.ts        POST /api/v1/auth/login
        logout/route.ts       POST /api/v1/auth/logout
      bookings/
        route.ts              GET (admin list) · POST (create)
        lookup/route.ts       GET /api/v1/bookings/lookup?reference=
        [id]/route.ts         GET (by UUID) · PATCH (update status)
      venues/
        route.ts              GET (list)
        [id]/route.ts         GET (by UUID) · PATCH (update settings)
    (admin)/                  ← admin pages (protected by proxy)
      login/                  /login
      admin/dashboard/        /admin/dashboard
      admin/venue/            /admin/venue (venue settings)
    (public)/                 ← guest-facing pages
      page.tsx                / (landing page)
      venue/[id]/             /venue/:id (venue detail)
      booking/                /booking (booking form)
      booking/confirmation/   /booking/confirmation (post-submit)
  lib/
    auth.ts                   requireAdmin() helper
    email.ts                  Resend email service (confirmation + admin notification)
    env.ts                    Zod env validation — throws at startup if vars missing
    logger.ts                 Structured JSON logger with requestId
    rate-limit.ts             In-memory rate limiter (IP-based)
    utils.ts                  formatCurrency, formatDate, deriveBookingPrice
    validations.ts            All Zod schemas — single source of truth
    constants.ts              Fallback time slots and pax packages
    supabase/
      server.ts               SSR-safe anon client (uses next/headers cookies)
      admin.ts                Service-role client (bypasses RLS)
      client.ts               Browser client
  types/index.ts              Shared TypeScript types
  proxy.ts                    Protects /admin/** routes (Next.js 16: renamed from middleware.ts)
supabase/
  migrations/
    001_schema.sql            venues + bookings tables, indexes
    002_rls.sql               Row Level Security policies
    003_booking_history.sql   Audit trail table
    004_atomic_booking.sql    Original create_booking_atomic() function
    005_pricing.sql           time_slots + pax_packages on venues; pricing columns on bookings
    006_atomic_booking_v2.sql Updated RPC with pricing params, SECURITY DEFINER, GRANT EXECUTE
```

### Two Supabase clients — why

| Client | Key used | Bypasses RLS | When to use |
|--------|----------|--------------|-------------|
| `createClient()` — `lib/supabase/server.ts` | Anon key | No | Auth checks, public reads (venues), booking insert via RPC |
| `createAdminClient()` — `lib/supabase/admin.ts` | Service role key | Yes | All admin operations, post-insert booking fetch |

The anon key is public (`NEXT_PUBLIC_`). RLS on `bookings` restricts SELECT to the service role so someone with the anon key cannot enumerate booking records directly via the Supabase REST endpoint.

### Race condition prevention

A guest booking goes through a Postgres function (`create_booking_atomic`) instead of a two-step check-then-insert in application code. The function locks approved rows for the venue+date with `FOR UPDATE`, checks for overlaps, then inserts — all inside one transaction. Two concurrent requests for the same slot will queue at the lock; the second gets `BOOKING_CONFLICT` and the API returns 409.

The function is defined with `SECURITY DEFINER` so it runs with DB owner privileges regardless of whether the caller is `anon` or `authenticated`.

### Audit trail

Every status change (pending → approved/rejected) writes a row to `booking_status_history` with the before/after status and the admin's email. This table is service-role only and is never exposed via the API.

### Session persistence

`proxy.ts` runs on every request matching `/admin/**`. It calls `supabase.auth.getUser()` on each request — this triggers a token refresh if the access token has expired but the refresh token is still valid, and writes the new tokens back to the response cookies. Without this, sessions would expire after ~1 hour.

---

## API Reference

All routes are under `/api/v1/`. Errors always return `{ "error": "..." }`.

### Auth

#### `POST /api/v1/auth/login`
Admin login. Sets a session cookie on success.

**Body**
```json
{ "email": "admin@example.com", "password": "..." }
```
**200** `{ "user": { "id": "...", "email": "..." } }`
**401** Invalid credentials
**403** Valid credentials but not an admin
**429** Rate limited (10 attempts / 15 min per IP)

---

#### `POST /api/v1/auth/logout`
Clears the admin session cookie.

**200** `{ "success": true }`

---

### Venues

#### `GET /api/v1/venues`
List all venues. Public.

**200** `Venue[]`

---

#### `GET /api/v1/venues/:id`
Get a single venue. Public.

**200** `Venue`
**404** Not found

---

#### `PATCH /api/v1/venues/:id`
Update venue time slots and guest packages. **Admin only.**

**Body**
```json
{
  "time_slots": [{ "label": "Morning", "start_time": "08:00", "end_time": "12:00", "price": 2000 }],
  "pax_packages": [{ "label": "Small", "min_pax": 50, "max_pax": 200, "price": 1000 }]
}
```
**200** Updated `Venue`
**401 / 403** Auth

---

### Bookings

#### `POST /api/v1/bookings`
Submit a booking request. Public. Rate-limited: 10 requests / 15 min per IP.

**Body**
```json
{
  "venue_id": "uuid",
  "user_name": "string (2–100 chars)",
  "user_email": "email",
  "user_phone": "+601X-XXXXXXXX (Malaysian format)",
  "event_name": "string (2–200 chars)",
  "date": "YYYY-MM-DD (today or future)",
  "start_time": "HH:MM",
  "end_time": "HH:MM (must be after start_time)",
  "guest_count": "integer ≥ 1",
  "pax_package_label": "string matching a venue pax package label",
  "notes": "string (optional, max 1000 chars)"
}
```
**201** `Booking` (includes `reference_number` and derived pricing)
**404** Venue not found
**409** Time slot already booked
**422** Validation errors or selected slot/package no longer available
**429** Rate limited

---

#### `GET /api/v1/bookings/lookup?reference=VB-xxx`
Look up a booking by reference number. Public. Rate-limited: 20 requests / 15 min per IP.

**200** `Booking`
**400** Missing `reference` param
**404** Not found

---

#### `GET /api/v1/bookings/:id`
Get a single booking by UUID. Public (UUID is the access secret).

**200** `Booking` with nested `venue { id, name, location }`
**404** Not found

---

#### `GET /api/v1/bookings?status=&page=&limit=`
List all bookings. **Admin only.**

| Param | Default | Notes |
|-------|---------|-------|
| `status` | — | Filter: `pending`, `approved`, or `rejected` |
| `page` | 1 | 1-indexed |
| `limit` | 20 | Max 100 |

**200** `{ "data": Booking[], "pagination": { "page", "limit", "total", "totalPages" } }`
**401 / 403** Auth

---

#### `PATCH /api/v1/bookings/:id`
Approve or reject a booking. **Admin only.** Only `pending` bookings can be actioned.

**Body** `{ "status": "approved" | "rejected" }`

**200** Updated `Booking`
**401 / 403** Auth
**404** Not found
**422** Booking is not pending, or invalid status value

---

## Database Schema

### `venues`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| description | text | |
| capacity | integer | > 0 |
| price_per_hour | numeric(10,2) | ≥ 0 |
| amenities | text[] | |
| images | text[] | Index 0 used as homepage banner image |
| location | text | |
| time_slots | jsonb | Array of `{ label, start_time, end_time, price }` |
| pax_packages | jsonb | Array of `{ label, min_pax, max_pax, price }` |
| created_at | timestamptz | |

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| venue_id | uuid FK → venues | ON DELETE RESTRICT |
| user_name | text | |
| user_email | text | |
| user_phone | text | Malaysian format |
| event_name | text | |
| date | date | |
| start_time | time | |
| end_time | time | CHECK end > start |
| status | text | `pending` / `approved` / `rejected` |
| reference_number | text UNIQUE | Format: `VB-{timestamp36}-{4chars}` |
| notes | text | nullable |
| guest_count | integer | nullable |
| pax_package_label | text | nullable — label of selected pax package |
| slot_price | numeric(10,2) | nullable — price snapshot at booking time |
| pax_price | numeric(10,2) | nullable — price snapshot at booking time |
| total_price | numeric(10,2) | nullable — slot_price + pax_price |
| created_at | timestamptz | |

### `booking_status_history`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| booking_id | uuid FK → bookings | ON DELETE CASCADE |
| from_status | text | null on first transition |
| to_status | text | |
| changed_by | text | admin email |
| changed_at | timestamptz | |

---

## Setup Guide

### 1. Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once the project is ready, go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to the **SQL Editor** and run each migration file in order:
   ```
   supabase/migrations/001_schema.sql
   supabase/migrations/002_rls.sql
   supabase/migrations/003_booking_history.sql
   supabase/migrations/004_atomic_booking.sql
   supabase/migrations/005_pricing.sql
   supabase/migrations/006_atomic_booking_v2.sql
   ```
4. Go to **Authentication → Users → Add user** and create the admin account.
5. After creating the user, open the user record and click **Edit**. Under **Custom Claims / app_metadata**, add:
   ```json
   { "role": "admin" }
   ```
   Save. This grants admin access to that account.
6. Add the first venue row directly in the **Table Editor** (`venues` table) or via SQL:
   ```sql
   INSERT INTO venues (name, description, capacity, price_per_hour, location, amenities)
   VALUES (
     'The Grand Hall at Majestic Place',
     'An elegant and spacious event hall in the heart of Kuala Lumpur.',
     1000,
     500,
     'Majestic Place, Kuala Lumpur',
     ARRAY['Air Conditioning','Stage & Podium','Sound System','Parking']
   );
   ```
   Then set pricing via the admin Venue Settings page.

---

### 2. Email (Resend)

Email notifications are optional. When `RESEND_API_KEY` is not set, all emails are silently skipped — the app works fully without them.

To enable:

1. Sign up at [resend.com](https://resend.com). The free tier covers 3,000 emails/month.
2. Go to **Domains** and add your sending domain (e.g. `yourdomain.com`). Follow the DNS verification steps. Alternatively, use Resend's shared `onresend.dev` domain for testing (no DNS setup needed).
3. Go to **API Keys** and create a key. Copy it to `RESEND_API_KEY`.
4. Set `RESEND_FROM_EMAIL` to a verified sender address, e.g.:
   ```
   The Grand Hall <noreply@yourdomain.com>
   ```
5. Set `ADMIN_NOTIFICATION_EMAIL` to the email address that should receive new booking alerts (e.g. the hall manager's email).

**Emails sent by the app:**

| Trigger | Recipient | Content |
|---------|-----------|---------|
| New booking submitted | Guest | Booking confirmation with reference number and details |
| New booking submitted | Admin (`ADMIN_NOTIFICATION_EMAIL`) | Full booking details with link to dashboard |
| Admin approves booking | Guest | Approval confirmation |
| Admin rejects booking | Guest | Rejection notice |

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key
SUPABASE_SERVICE_ROLE_KEY=        # Secret — server only, never expose to client

# Email notifications via Resend (https://resend.com)
# Leave blank to disable emails during development
RESEND_API_KEY=                   # Resend API key
RESEND_FROM_EMAIL=                # e.g. The Grand Hall <noreply@yourdomain.com>
ADMIN_NOTIFICATION_EMAIL=         # Email address to notify on new booking submissions

# App
APP_URL=                          # e.g. https://yourdomain.com (used in email links)
```

---

## Key Design Decisions

**No user accounts for guests** — guests book by submitting a form. The `reference_number` is their only identifier. No signup friction, no forgotten passwords.

**Server-side price derivation** — the client never sends prices. On submission, the server re-fetches the venue's `time_slots` and `pax_packages`, matches the submitted slot and package labels, and derives the price. This prevents price tampering from the client.

**`proxy.ts` not `middleware.ts`** — Next.js 16 deprecated `middleware.ts` and renamed it `proxy.ts` with a named `proxy` export. The proxy handles page-level session refresh and admin route protection; every API route independently validates auth (defense in depth).

**Service role for all booking reads** — `bookings` SELECT is restricted to service_role in RLS. Because the anon key is public, without this anyone could query all bookings directly via the Supabase REST endpoint.

**Atomic booking via Postgres function** — `create_booking_atomic()` uses `SELECT ... FOR UPDATE` to serialize concurrent inserts for the same venue+date. Double-bookings are impossible at the DB level. Defined with `SECURITY DEFINER` so RLS does not block the insert regardless of the caller's role.

**Emails are fire-and-forget** — email delivery failures do not fail the booking request. The error is logged server-side. Emails are fully optional and disabled when `RESEND_API_KEY` is not set.

**Rate limiting is in-memory** — the current `Map`-based implementation works for single-instance deployments. For multi-instance production (e.g. serverless/edge), swap `src/lib/rate-limit.ts` for a Redis-backed implementation — the interface (`checkRateLimit`, `rateLimitHeaders`) does not change.
