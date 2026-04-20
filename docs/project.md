# Venue Booking Web App

**The Grand Hall at Majestic Place** — a full-stack hall booking system where guests submit booking requests and an admin reviews and approves or rejects them.

- **Deadline:** Sunday, 26 April 2026, 1:00 PM MYT
- **Stack:** Next.js 16 · TypeScript · Tailwind CSS · Supabase · React Hook Form · Zod v4

---

## Requirements

| # | Requirement                               | Backend | Frontend |
|---|-------------------------------------------|---------|----------|
| 1 | Responsive landing page                   | —       | ⬜ Todo  |
| 2 | Venue details page with key information   | ✅ Done | ⬜ Todo  |
| 3 | Booking request form                      | ✅ Done | ⬜ Todo  |
| 4 | Date and time slot selection              | ✅ Done | ⬜ Todo  |
| 5 | Booking confirmation page                 | ✅ Done | ⬜ Todo  |
| 6 | Admin login page                          | ✅ Done | ⬜ Todo  |
| 7 | Admin dashboard to manage bookings        | ✅ Done | ⬜ Todo  |
| 8 | Booking statuses: pending/approved/rejected | ✅ Done | ⬜ Todo |
| 9 | Proper form validation                    | ✅ Done | ⬜ Todo  |
| 10| Clean, user-friendly experience           | —       | ⬜ Todo  |

---

## How the App Works

### Guest flow (no account required)
1. Guest visits the landing page and reads venue information.
2. Guest goes to the venue detail page, picks a date and time slot.
3. Guest fills in the booking form (name, email, event name, optional notes) and submits.
4. The API creates a `pending` booking and returns a `reference_number`.
5. Guest is redirected to the confirmation page showing their reference number.
6. A confirmation email is sent to the guest's email address (if Resend is configured).

### Admin flow
1. Admin navigates to `/admin` — the proxy intercepts and redirects to `/login` if not authenticated.
2. Admin logs in with email and password via `POST /api/v1/auth/login`.
3. Supabase sets a session cookie. All subsequent admin requests carry this cookie.
4. Admin views all bookings on the dashboard, filtered by status or searched by name/date.
5. Admin approves or rejects a `pending` booking.
6. The booking status changes and an email is sent to the guest.

> Admin accounts are created manually in the Supabase dashboard.  
> Set `app_metadata: { "role": "admin" }` on the user record to grant access.  
> Only `pending` bookings can be actioned — approved/rejected bookings are final.

---

## Architecture

### File structure

```
src/
  app/
    api/v1/               ← all API routes (versioned)
      auth/
        login/route.ts    POST /api/v1/auth/login
        logout/route.ts   POST /api/v1/auth/logout
      bookings/
        route.ts          GET (admin list) · POST (create)
        lookup/route.ts   GET /api/v1/bookings/lookup?reference=
        [id]/route.ts     GET (by UUID) · PATCH (update status)
      venues/
        route.ts          GET (list)
        [id]/route.ts     GET (by UUID)
    (admin)/              ← admin pages (protected by proxy)
    (public)/             ← guest-facing pages
  lib/
    auth.ts               requireAdmin() helper
    email.ts              Resend email service
    env.ts                Zod env validation (throws at startup if vars missing)
    logger.ts             Structured JSON logger with requestId
    rate-limit.ts         In-memory rate limiter (IP-based)
    utils.ts              Shared constants (UUID_REGEX)
    validations.ts        All Zod schemas — single source of truth
    supabase/
      server.ts           SSR-safe anon client (uses next/headers cookies)
      admin.ts            Service-role client (bypasses RLS, no cookies)
      client.ts           Browser client
  types/index.ts          Shared TypeScript types
  proxy.ts                Protects /admin/** routes (Next.js 16: was middleware.ts)
supabase/
  migrations/
    001_schema.sql        venues + bookings tables, indexes
    002_rls.sql           Row Level Security policies
    003_booking_history.sql  Audit trail table
    004_atomic_booking.sql   PG function: create_booking_atomic()
```

### Two Supabase clients — why

| Client | Key used | Bypasses RLS | When to use |
|--------|----------|--------------|-------------|
| `createClient()` in `lib/supabase/server.ts` | Anon key | No | Auth checks, public reads (venues), booking insert |
| `createAdminClient()` in `lib/supabase/admin.ts` | Service role key | Yes | All admin operations, booking reads (RLS restricts SELECT to service_role) |

The anon key is public (`NEXT_PUBLIC_`). RLS on `bookings` restricts SELECT to the service role so someone with the anon key cannot enumerate booking records directly via the Supabase REST endpoint.

### Race condition prevention

A guest booking goes through a Postgres function (`create_booking_atomic`) instead of a two-step check-then-insert in application code. The function locks approved rows for the venue+date with `FOR UPDATE`, checks for overlaps, then inserts — all inside one transaction. Two concurrent requests for the same slot will queue at the lock; the second one gets `BOOKING_CONFLICT` and returns 409.

### Audit trail

Every status change (pending → approved/rejected) writes a row to `booking_status_history` with the before/after status and the admin's email. This table is service-role only and is never exposed via the API.

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
**401** Invalid credentials (same message for wrong email and wrong password — no enumeration)  
**403** Valid credentials but account is not an admin  
**429** Rate limit exceeded (10 attempts / 15 min per IP)

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

### Bookings

#### `POST /api/v1/bookings`
Submit a booking request. Public. Rate-limited: 10 requests / 15 min per IP.

**Body**
```json
{
  "venue_id": "uuid",
  "user_name": "string (2–100 chars)",
  "user_email": "email",
  "event_name": "string (2–200 chars)",
  "date": "YYYY-MM-DD (today or future)",
  "start_time": "HH:MM (00:00–23:59)",
  "end_time": "HH:MM (must be after start_time)",
  "notes": "string (optional, max 1000 chars)"
}
```
**201** `Booking` (includes `reference_number`)  
**404** Venue not found  
**409** Time slot already booked  
**422** Validation errors  
**429** Rate limit exceeded

---

#### `GET /api/v1/bookings/lookup?reference=VB-xxx`
Look up a booking by reference number. Public. Rate-limited: 20 requests / 15 min per IP.  
Used on the confirmation page when the guest only has their reference number.

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

**200**
```json
{
  "data": "Booking[]",
  "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```
**401** Not authenticated  
**403** Not an admin

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
| images | text[] | |
| location | text | |
| created_at | timestamptz | |

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| venue_id | uuid FK → venues | ON DELETE RESTRICT |
| user_name | text | |
| user_email | text | |
| event_name | text | |
| date | date | |
| start_time | time | |
| end_time | time | CHECK end > start |
| status | text | pending / approved / rejected |
| reference_number | text UNIQUE | Format: `VB-{timestamp}-{4chars}` |
| notes | text | nullable |
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

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public anon key
SUPABASE_SERVICE_ROLE_KEY=       # Secret — server only, never expose to client

# Optional (email notifications via Resend)
RESEND_API_KEY=                  # Leave blank to skip emails in development
RESEND_FROM_EMAIL=               # e.g. Venue Booking <noreply@yourdomain.com>
APP_URL=                         # e.g. https://yourdomain.com (used in email links)
```

---

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npm run dev                  # http://localhost:3000
```

Apply migrations in the Supabase dashboard SQL editor, or via the Supabase CLI:

```bash
supabase db push
```

---

## Key Design Decisions

**No user accounts for guests** — guests book by submitting a form. The `reference_number` returned on creation is their only identifier. No signup friction, no forgotten passwords.

**`proxy.ts` not `middleware.ts`** — Next.js 16 deprecated `middleware.ts` and renamed it `proxy.ts` with a named `proxy` export. The proxy only handles page-level redirects; every API route does its own auth check independently (defense in depth).

**Service role for all booking reads** — `bookings` SELECT is restricted to service_role in RLS. Because the anon key is public (`NEXT_PUBLIC_`), without this restriction anyone could query all bookings directly through the Supabase REST endpoint. The API layer is the only legitimate entry point.

**Atomic booking via Postgres function** — application-level check-then-insert has a race condition window. `create_booking_atomic()` uses `SELECT ... FOR UPDATE` to serialize concurrent inserts for the same venue+date, making double-bookings impossible at the DB level.

**Emails are fire-and-forget** — email delivery failures do not fail the booking request. The confirmation is logged server-side if sending fails. Emails are optional (disabled when `RESEND_API_KEY` is not set) so local development works without configuration.

**Rate limiting is in-memory** — the current `Map`-based implementation works for single-instance deployments. For multi-instance production (e.g. serverless), swap `src/lib/rate-limit.ts` for a Redis-backed implementation — the interface (`checkRateLimit`, `rateLimitHeaders`) does not change.
