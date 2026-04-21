# UI/UX Revamp + Venue-Driven Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all broken UX (date picker, hardcoded slots, missing phone), add pax-tier pricing driven by venue DB, and add an admin venue settings page.

**Architecture:** DB migrations first (venues + bookings schema), then backend (new PATCH venue endpoint, updated atomic booking function with server-side price derivation), then frontend components in dependency order (pickers → form → pages), then admin UI last.

**Tech Stack:** Next.js 16 App Router · TypeScript · Supabase (Postgres RPC + JSONB) · React Hook Form v7 · Zod v4 · react-day-picker v9 · Tailwind CSS v4

---

## Task 1: Jest Setup

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Create jest config**

```ts
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterFramework: ['./jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }] },
}

export default config
```

- [ ] **Step 2: Create jest setup file**

```ts
// jest.setup.ts
// placeholder — extend with matchers if needed
```

- [ ] **Step 3: Add test script to package.json**

In `package.json` scripts, add:
```json
"test": "jest"
```

- [ ] **Step 4: Create test directory**

```bash
mkdir -p src/__tests__
```

- [ ] **Step 5: Verify jest runs**

```bash
cd f:/dev/venue-booking && npx jest --passWithNoTests
```
Expected: `Test Suites: 0 passed, 0 total`

- [ ] **Step 6: Commit**

```bash
git add jest.config.ts jest.setup.ts package.json
git commit -m "chore: add jest configuration"
```

---

## Task 2: Database Migration — Schema Changes

**Files:**
- Create: `supabase/migrations/005_pricing.sql`

- [ ] **Step 1: Write migration 005**

```sql
-- supabase/migrations/005_pricing.sql

-- Add time_slots and pax_packages to venues
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS time_slots   JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS pax_packages JSONB NOT NULL DEFAULT '[]';

-- Add new booking fields
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS user_phone        TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS guest_count       INTEGER,
  ADD COLUMN IF NOT EXISTS pax_package_label TEXT,
  ADD COLUMN IF NOT EXISTS slot_price        NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS pax_price         NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS total_price       NUMERIC(10,2);

-- Seed default pricing into all existing venues
UPDATE venues SET
  time_slots = '[
    {"label":"Morning",   "start_time":"08:00","end_time":"12:00","price":2000},
    {"label":"Afternoon", "start_time":"13:00","end_time":"17:00","price":2000},
    {"label":"Evening",   "start_time":"18:00","end_time":"23:00","price":2500},
    {"label":"Full Day",  "start_time":"08:00","end_time":"23:00","price":5500}
  ]'::jsonb,
  pax_packages = '[
    {"label":"Small",  "min_pax":50,  "max_pax":200,  "price":1000},
    {"label":"Medium", "min_pax":201, "max_pax":400,  "price":2500},
    {"label":"Large",  "min_pax":401, "max_pax":600,  "price":4500},
    {"label":"Grand",  "min_pax":601, "max_pax":1000, "price":7000}
  ]'::jsonb
WHERE time_slots = '[]'::jsonb;
```

- [ ] **Step 2: Run in Supabase dashboard**

Go to Supabase → SQL Editor → paste the contents of `005_pricing.sql` → Run.
Expected: no errors, `UPDATE X` for existing venues.

- [ ] **Step 3: Commit migration file**

```bash
git add supabase/migrations/005_pricing.sql
git commit -m "chore: migration 005 - add time_slots, pax_packages to venues; add pricing fields to bookings"
```

---

## Task 3: Database Migration — Updated Atomic Booking Function

**Files:**
- Create: `supabase/migrations/006_atomic_booking_v2.sql`

- [ ] **Step 1: Write migration 006**

```sql
-- supabase/migrations/006_atomic_booking_v2.sql
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_venue_id          UUID,
  p_user_name         TEXT,
  p_user_email        TEXT,
  p_user_phone        TEXT,
  p_event_name        TEXT,
  p_date              DATE,
  p_start_time        TIME,
  p_end_time          TIME,
  p_notes             TEXT,
  p_reference_number  TEXT,
  p_guest_count       INTEGER,
  p_pax_package_label TEXT,
  p_slot_price        NUMERIC(10,2),
  p_pax_price         NUMERIC(10,2),
  p_total_price       NUMERIC(10,2)
) RETURNS UUID
LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Lock all approved rows for this venue+date so concurrent calls queue up
  PERFORM id
  FROM bookings
  WHERE venue_id = p_venue_id
    AND date     = p_date
    AND status   = 'approved'
  FOR UPDATE;

  -- Check for an overlapping approved booking
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE venue_id   = p_venue_id
      AND date       = p_date
      AND status     = 'approved'
      AND start_time < p_end_time
      AND end_time   > p_start_time
  ) THEN
    RAISE EXCEPTION 'BOOKING_CONFLICT';
  END IF;

  INSERT INTO bookings (
    venue_id, user_name, user_email, user_phone, event_name,
    date, start_time, end_time, notes, reference_number, status,
    guest_count, pax_package_label, slot_price, pax_price, total_price
  ) VALUES (
    p_venue_id, p_user_name, p_user_email, p_user_phone, p_event_name,
    p_date, p_start_time, p_end_time, p_notes, p_reference_number, 'pending',
    p_guest_count, p_pax_package_label, p_slot_price, p_pax_price, p_total_price
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
```

- [ ] **Step 2: Run in Supabase dashboard**

Go to Supabase → SQL Editor → paste contents of `006_atomic_booking_v2.sql` → Run.
Expected: `CREATE OR REPLACE FUNCTION`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/006_atomic_booking_v2.sql
git commit -m "chore: migration 006 - update create_booking_atomic with pricing params"
```

---

## Task 4: Types, Interfaces, and Price Utility

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/validations.ts`
- Modify: `src/lib/utils.ts`
- Create: `src/__tests__/pricing.test.ts`

- [ ] **Step 1: Write the failing test first**

```ts
// src/__tests__/pricing.test.ts
import { deriveBookingPrice } from '@/lib/utils'
import type { TimeSlot, PaxPackage } from '@/types'

const slots: TimeSlot[] = [
  { label: 'Morning', start_time: '08:00', end_time: '12:00', price: 2000 },
  { label: 'Evening', start_time: '18:00', end_time: '23:00', price: 2500 },
]
const packages: PaxPackage[] = [
  { label: 'Small',  min_pax: 50,  max_pax: 200, price: 1000 },
  { label: 'Large',  min_pax: 401, max_pax: 600, price: 4500 },
]

describe('deriveBookingPrice', () => {
  it('returns null when slot not found', () => {
    expect(deriveBookingPrice('09:00', '13:00', 'Small', slots, packages)).toBeNull()
  })

  it('returns null when package not found', () => {
    expect(deriveBookingPrice('08:00', '12:00', 'Grand', slots, packages)).toBeNull()
  })

  it('returns correct prices for valid slot + package', () => {
    const result = deriveBookingPrice('08:00', '12:00', 'Small', slots, packages)
    expect(result).toEqual({ slotPrice: 2000, paxPrice: 1000, totalPrice: 3000 })
  })

  it('adds Evening slot price to Large package', () => {
    const result = deriveBookingPrice('18:00', '23:00', 'Large', slots, packages)
    expect(result).toEqual({ slotPrice: 2500, paxPrice: 4500, totalPrice: 7000 })
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd f:/dev/venue-booking && npx jest pricing.test --no-coverage
```
Expected: FAIL — `deriveBookingPrice` not found

- [ ] **Step 3: Update types**

Replace the full contents of `src/types/index.ts`:

```ts
export type BookingStatus = 'pending' | 'approved' | 'rejected'

export interface TimeSlot {
  label: string
  start_time: string
  end_time: string
  price: number
}

export interface PaxPackage {
  label: string
  min_pax: number
  max_pax: number
  price: number
}

export interface Venue {
  id: string
  name: string
  description: string
  capacity: number
  price_per_hour: number
  amenities: string[]
  images: string[]
  location: string
  time_slots: TimeSlot[]
  pax_packages: PaxPackage[]
  created_at: string
}

export interface Booking {
  id: string
  venue_id: string
  user_name: string
  user_email: string
  user_phone: string
  event_name: string
  date: string
  start_time: string
  end_time: string
  status: BookingStatus
  reference_number: string
  notes: string | null
  guest_count: number | null
  pax_package_label: string | null
  slot_price: number | null
  pax_price: number | null
  total_price: number | null
  created_at: string
  venue?: Pick<Venue, 'id' | 'name' | 'location'>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  error: string
}

export type BookingWithVenue = Booking & {
  venue: Pick<Venue, 'id' | 'name' | 'location'>
}

export type { CreateBookingInput, UpdateBookingStatusInput } from '@/lib/validations'
```

- [ ] **Step 4: Add `deriveBookingPrice` to utils**

Append to `src/lib/utils.ts`:

```ts
import type { TimeSlot, PaxPackage } from '@/types'

export interface DerivedPrice {
  slotPrice: number
  paxPrice: number
  totalPrice: number
}

export function deriveBookingPrice(
  startTime: string,
  endTime: string,
  paxPackageLabel: string,
  timeSlots: TimeSlot[],
  paxPackages: PaxPackage[]
): DerivedPrice | null {
  const slot = timeSlots.find(
    (s) => s.start_time === startTime && s.end_time === endTime
  )
  const pkg = paxPackages.find((p) => p.label === paxPackageLabel)
  if (!slot || !pkg) return null
  return {
    slotPrice: slot.price,
    paxPrice: pkg.price,
    totalPrice: slot.price + pkg.price,
  }
}
```

- [ ] **Step 5: Update Zod schema**

In `src/lib/validations.ts`, update `createBookingSchema` — add three fields and remove `notes` being optional (it stays optional, just making sure the new fields are added):

```ts
// Replace the createBookingSchema definition:
export const createBookingSchema = z
  .object({
    venue_id: z.uuid(),
    user_name: z.string().min(2).max(100),
    user_email: z.email(),
    user_phone: z.string().regex(/^(\+?60|0)\d{8,10}$/, 'Invalid Malaysian phone number'),
    event_name: z.string().min(2).max(200),
    date: z.iso.date().refine(
      (d) => d >= new Date().toISOString().slice(0, 10),
      { message: 'Booking date must not be in the past' }
    ),
    start_time: z.string().regex(TIME_REGEX, 'Invalid time format (HH:MM)'),
    end_time: z.string().regex(TIME_REGEX, 'Invalid time format (HH:MM)'),
    guest_count: z.number().int().min(1).max(10000),
    pax_package_label: z.string().min(1),
    notes: z.string().max(1000).optional(),
  })
  .refine((d) => d.start_time < d.end_time, {
    message: 'end_time must be after start_time',
    path: ['end_time'],
  })
```

Also add to `src/lib/validations.ts`:

```ts
const TIME_REGEX_LOCAL = /^([01]\d|2[0-3]):[0-5]\d$/

export const updateVenueSettingsSchema = z.object({
  time_slots: z.array(z.object({
    label: z.string().min(1),
    start_time: z.string().regex(TIME_REGEX_LOCAL),
    end_time: z.string().regex(TIME_REGEX_LOCAL),
    price: z.number().min(0),
  })).min(1, 'At least one time slot required'),
  pax_packages: z.array(z.object({
    label: z.string().min(1),
    min_pax: z.number().int().min(1),
    max_pax: z.number().int().min(1),
    price: z.number().min(0),
  })).min(1, 'At least one guest package required'),
})

export type UpdateVenueSettingsInput = z.infer<typeof updateVenueSettingsSchema>
```

- [ ] **Step 6: Update constants.ts fallback to use new TimeSlot type**

In `src/lib/constants.ts`, update the import and `TIME_SLOTS` — remove `duration` field to match the new `TimeSlot` type, and add a comment marking it as a fallback:

```ts
import type { TimeSlot, PaxPackage } from '@/types'

// UI fallback — used only when venue API returns empty arrays (e.g. dev without seed data)
export const TIME_SLOTS_FALLBACK: TimeSlot[] = [
  { label: 'Morning',   start_time: '08:00', end_time: '12:00', price: 2000 },
  { label: 'Afternoon', start_time: '13:00', end_time: '17:00', price: 2000 },
  { label: 'Evening',   start_time: '18:00', end_time: '23:00', price: 2500 },
  { label: 'Full Day',  start_time: '08:00', end_time: '23:00', price: 5500 },
]

export const PAX_PACKAGES_FALLBACK: PaxPackage[] = [
  { label: 'Small',  min_pax: 50,  max_pax: 200,  price: 1000 },
  { label: 'Medium', min_pax: 201, max_pax: 400,  price: 2500 },
  { label: 'Large',  min_pax: 401, max_pax: 600,  price: 4500 },
  { label: 'Grand',  min_pax: 601, max_pax: 1000, price: 7000 },
]

export { TimeSlot, PaxPackage }
```

Keep the existing `VENUE_FALLBACK`, `STATUS_LABELS`, `STATUS_COLORS` unchanged. Remove the old `TIME_SLOTS` export and the old `TimeSlot` interface (they now live in `src/types/index.ts`).

- [ ] **Step 7: Run tests**

```bash
cd f:/dev/venue-booking && npx jest pricing.test --no-coverage
```
Expected: `Tests: 4 passed`

- [ ] **Step 8: TypeScript check**

```bash
cd f:/dev/venue-booking && npx tsc --noEmit
```
Fix any type errors before proceeding.

- [ ] **Step 9: Commit**

```bash
git add src/types/index.ts src/lib/validations.ts src/lib/utils.ts src/lib/constants.ts src/__tests__/pricing.test.ts
git commit -m "feat: add TimeSlot/PaxPackage types, deriveBookingPrice utility, update Zod schema"
```

---

## Task 5: Venue API — Add PATCH Endpoint for Settings

**Files:**
- Modify: `src/app/api/v1/venues/[id]/venue-detail.ts`
- Modify: `src/app/api/v1/venues/[id]/route.ts`
- Create: `src/services/venues.ts` (update, not recreate)

- [ ] **Step 1: Add PATCH handler to venue-detail.ts**

Append to `src/app/api/v1/venues/[id]/venue-detail.ts`:

```ts
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, isAdminResult } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { updateVenueSettingsSchema } from '@/lib/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createClient()
  const authResult = await requireAdmin(supabase)
  if (!isAdminResult(authResult)) return authResult

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = updateVenueSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('venues')
    .update({
      time_slots: parsed.data.time_slots,
      pax_packages: parsed.data.pax_packages,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return Response.json({ error: 'Not found' }, { status: 404 })
    logger.error('Failed to update venue settings', { venueId: id, error: error.message })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json(data)
}
```

The existing `venue-detail.ts` already imports `logger`, `UUID_REGEX`, and `NextRequest` — add the new imports for `createAdminClient`, `requireAdmin`, `isAdminResult`, `createClient`, and `updateVenueSettingsSchema`.

- [ ] **Step 2: Wire PATCH into route.ts**

Replace `src/app/api/v1/venues/[id]/route.ts` with:

```ts
import { GET, PATCH } from './venue-detail'
export { GET, PATCH }
```

- [ ] **Step 3: Add updateVenueSettings to services**

Read `src/services/venues.ts` first, then append:

```ts
import type { UpdateVenueSettingsInput } from '@/lib/validations'
import type { Venue } from '@/types'

export async function updateVenueSettings(id: string, input: UpdateVenueSettingsInput): Promise<Venue> {
  return apiFetch<Venue>(`/api/v1/venues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd f:/dev/venue-booking && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/v1/venues/[id]/venue-detail.ts src/app/api/v1/venues/[id]/route.ts src/services/venues.ts
git commit -m "feat: add PATCH /api/v1/venues/:id for venue settings update"
```

---

## Task 6: Booking API — Server-Side Price Derivation

**Files:**
- Modify: `src/app/api/v1/bookings/bookings-collection.ts`

- [ ] **Step 1: Update the POST handler**

In `src/app/api/v1/bookings/bookings-collection.ts`, update the `POST` function.

Change the venue fetch to also get `time_slots` and `pax_packages`:

```ts
// Replace the venue fetch query:
const { data: venue, error: venueError } = await supabase
  .from('venues')
  .select('id, name, time_slots, pax_packages')
  .eq('id', input.venue_id)
  .single()
```

After the venue fetch, add server-side price derivation (add this import at the top of the file):

```ts
import { deriveBookingPrice } from '@/lib/utils'
import type { TimeSlot, PaxPackage } from '@/types'
```

Then after the venue null check, add:

```ts
const derived = deriveBookingPrice(
  input.start_time,
  input.end_time,
  input.pax_package_label,
  (venue.time_slots as TimeSlot[]) ?? [],
  (venue.pax_packages as PaxPackage[]) ?? []
)

if (!derived) {
  return Response.json(
    { error: 'Selected time slot or guest package is no longer available' },
    { status: 422 }
  )
}
```

Then update the `supabase.rpc` call to pass the new params:

```ts
const { data, error } = await supabase.rpc('create_booking_atomic', {
  p_venue_id:          input.venue_id,
  p_user_name:         input.user_name,
  p_user_email:        input.user_email,
  p_user_phone:        input.user_phone,
  p_event_name:        input.event_name,
  p_date:              input.date,
  p_start_time:        input.start_time,
  p_end_time:          input.end_time,
  p_notes:             input.notes ?? null,
  p_reference_number:  generateReference(),
  p_guest_count:       input.guest_count,
  p_pax_package_label: input.pax_package_label,
  p_slot_price:        derived.slotPrice,
  p_pax_price:         derived.paxPrice,
  p_total_price:       derived.totalPrice,
})
```

- [ ] **Step 2: TypeScript check**

```bash
cd f:/dev/venue-booking && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/bookings/bookings-collection.ts
git commit -m "feat: derive booking prices server-side from venue data"
```

---

## Task 7: DatePicker — Fix Bugs + Dropdown Navigation

**Files:**
- Modify: `src/components/booking/date-picker.tsx`

- [ ] **Step 1: Rewrite date-picker.tsx**

```tsx
'use client'

import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  error?: string
}

const today = new Date()
today.setHours(0, 0, 0, 0)

export function DatePicker({ value, onChange, error }: DatePickerProps) {
  return (
    <div>
      <div className={cn('rounded-xl border bg-white p-3', error ? 'border-red-400' : 'border-slate-200')}>
        <DayPicker
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={{ before: today }}
          captionLayout="dropdown"
          classNames={{
            root: 'w-full',
            months: 'flex flex-col',
            month: 'w-full',
            month_caption: 'flex items-center justify-between px-1 pb-3',
            dropdowns: 'flex items-center gap-2',
            dropdown: 'border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-900 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500',
            dropdown_root: 'relative',
            nav: 'flex items-center gap-1',
            button_previous: 'h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors',
            button_next: 'h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors',
            month_grid: 'w-full border-collapse',
            weekdays: 'flex mb-1',
            weekday: 'flex-1 text-center text-xs font-semibold text-slate-400 py-1',
            week: 'flex',
            day: 'flex-1 p-0.5',
            day_button: cn(
              'h-9 w-full rounded-lg text-sm font-medium transition-colors',
              'hover:bg-amber-50 hover:text-amber-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500'
            ),
            selected: '[&>button]:bg-amber-600 [&>button]:text-white [&>button]:hover:bg-amber-700 [&>button]:hover:text-white',
            today: '[&>button]:font-bold [&>button]:text-amber-600',
            disabled: '[&>button]:text-slate-300 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent [&>button]:hover:text-slate-300',
            outside: '[&>button]:text-slate-300',
          }}
          fromYear={new Date().getFullYear()}
          toYear={new Date().getFullYear() + 3}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
cd f:/dev/venue-booking && npm run dev
```
Navigate to `http://localhost:3000/booking`. Verify:
- Calendar renders with days visible
- Clicking a day selects it (amber highlight)
- Month/year dropdowns change the displayed month
- Arrow buttons also navigate months
- Past days are greyed out and unclickable

- [ ] **Step 3: Commit**

```bash
git add src/components/booking/date-picker.tsx
git commit -m "fix: date picker - add dropdown navigation, fix day selection, enlarge cells"
```

---

## Task 8: SlotPicker — Props-Driven + Price Display

**Files:**
- Modify: `src/components/booking/slot-picker.tsx`

- [ ] **Step 1: Update SlotPicker to accept slots as props**

```tsx
'use client'

import { cn, formatCurrency } from '@/lib/utils'
import type { TimeSlot } from '@/types'

interface SlotPickerProps {
  slots: TimeSlot[]
  value: TimeSlot | null
  onChange: (slot: TimeSlot) => void
  error?: string
}

export function SlotPicker({ slots, value, onChange, error }: SlotPickerProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot) => {
          const selected = value?.label === slot.label
          return (
            <button
              key={slot.label}
              type="button"
              onClick={() => onChange(slot)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                selected
                  ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <span className="font-semibold">{slot.label}</span>
              <span className="text-xs text-slate-500">
                {slot.start_time} – {slot.end_time}
              </span>
              <span className={cn('mt-1 text-sm font-bold', selected ? 'text-amber-700' : 'text-slate-900')}>
                + {formatCurrency(slot.price)}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/booking/slot-picker.tsx
git commit -m "feat: slot picker accepts slots as props, shows additive price"
```

---

## Task 9: PaxPicker — New Component

**Files:**
- Create: `src/components/booking/pax-picker.tsx`

- [ ] **Step 1: Create pax-picker.tsx**

```tsx
'use client'

import { cn, formatCurrency } from '@/lib/utils'
import type { PaxPackage } from '@/types'

interface PaxPickerProps {
  packages: PaxPackage[]
  value: PaxPackage | null
  onChange: (pkg: PaxPackage) => void
  error?: string
}

export function PaxPicker({ packages, value, onChange, error }: PaxPickerProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        {packages.map((pkg) => {
          const selected = value?.label === pkg.label
          return (
            <button
              key={pkg.label}
              type="button"
              onClick={() => onChange(pkg)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                selected
                  ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <span className="font-semibold">{pkg.label}</span>
              <span className="text-xs text-slate-500">
                {pkg.min_pax} – {pkg.max_pax} guests
              </span>
              <span className={cn('mt-1 text-sm font-bold', selected ? 'text-amber-700' : 'text-slate-900')}>
                + {formatCurrency(pkg.price)}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/booking/pax-picker.tsx
git commit -m "feat: add PaxPicker component"
```

---

## Task 10: BookingSummary — New Sidebar Component

**Files:**
- Create: `src/components/booking/booking-summary.tsx`

- [ ] **Step 1: Create booking-summary.tsx**

```tsx
'use client'

import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import type { TimeSlot, PaxPackage } from '@/types'

interface BookingSummaryProps {
  date: Date | undefined
  slot: TimeSlot | null
  paxPackage: PaxPackage | null
}

export function BookingSummary({ date, slot, paxPackage }: BookingSummaryProps) {
  const total = slot && paxPackage ? slot.price + paxPackage.price : null

  return (
    <div className="bg-white border-2 border-amber-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Booking Summary</p>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Date</span>
          <span className="font-medium text-slate-900">
            {date ? format(date, 'dd MMM yyyy') : <span className="text-slate-300">—</span>}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Time Slot</span>
          <div className="text-right">
            {slot ? (
              <>
                <div className="font-medium text-slate-900">{slot.label}</div>
                <div className="text-xs text-slate-400">{slot.start_time} – {slot.end_time}</div>
              </>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Guests</span>
          <div className="text-right">
            {paxPackage ? (
              <>
                <div className="font-medium text-slate-900">{paxPackage.label}</div>
                <div className="text-xs text-slate-400">{paxPackage.min_pax} – {paxPackage.max_pax} pax</div>
              </>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>
        </div>
      </div>

      {(slot || paxPackage) && (
        <>
          <div className="border-t border-dashed border-amber-200 pt-3 space-y-1.5 text-sm">
            {slot && (
              <div className="flex justify-between">
                <span className="text-slate-500">Time Slot</span>
                <span className="text-slate-900">{formatCurrency(slot.price)}</span>
              </div>
            )}
            {paxPackage && (
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Package</span>
                <span className="text-slate-900">{formatCurrency(paxPackage.price)}</span>
              </div>
            )}
          </div>

          {total !== null && (
            <div className="border-t border-amber-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-amber-600">{formatCurrency(total)}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/booking/booking-summary.tsx
git commit -m "feat: add live BookingSummary sidebar component"
```

---

## Task 11: BookingForm — Full Update

**Files:**
- Modify: `src/components/booking/booking-form.tsx`

- [ ] **Step 1: Rewrite booking-form.tsx**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBookingSchema, type CreateBookingInput } from '@/lib/validations'
import { useCreateBooking } from '@/hooks/useCreateBooking'
import { toast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { DatePicker } from './date-picker'
import { SlotPicker } from './slot-picker'
import { PaxPicker } from './pax-picker'
import type { TimeSlot, PaxPackage } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { CalendarCheck } from 'lucide-react'

interface BookingFormProps {
  venueId: string
  timeSlots: TimeSlot[]
  paxPackages: PaxPackage[]
}

export function BookingForm({ venueId, timeSlots, paxPackages }: BookingFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { submit, loading } = useCreateBooking()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedPax, setSelectedPax] = useState<PaxPackage | null>(null)

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: { venue_id: venueId },
    mode: 'onBlur',
  })

  // Pre-select slot from ?slot= query param
  useEffect(() => {
    const slotParam = searchParams.get('slot')
    if (!slotParam) return
    const match = timeSlots.find(
      (s) => s.label.toLowerCase().replace(/\s+/g, '-') === slotParam
    )
    if (match) {
      setSelectedSlot(match)
      setValue('start_time', match.start_time)
      setValue('end_time', match.end_time)
    }
  }, [searchParams, setValue, timeSlots])

  function handleDateChange(date: Date | undefined) {
    setSelectedDate(date)
    if (date) setValue('date', format(date, 'yyyy-MM-dd'))
  }

  function handleSlotChange(slot: TimeSlot) {
    setSelectedSlot(slot)
    setValue('start_time', slot.start_time)
    setValue('end_time', slot.end_time)
  }

  function handlePaxChange(pkg: PaxPackage) {
    setSelectedPax(pkg)
    setValue('guest_count', pkg.min_pax) // use min as representative value; server validates range
    setValue('pax_package_label', pkg.label)
  }

  async function onSubmit(data: CreateBookingInput) {
    const result = await submit(data)
    if (result) {
      router.push(`/booking/confirmation?id=${result.id}`)
    } else {
      toast({ title: 'Booking failed', description: 'Please check your details and try again.', variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <input type="hidden" {...register('venue_id')} />

      {/* Selected package banner */}
      {selectedSlot && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Selected Package</p>
            <p className="mt-0.5 text-base font-bold text-amber-800">
              {selectedSlot.label} — {formatCurrency(selectedSlot.price)}
              {selectedPax ? ` + ${formatCurrency(selectedPax.price)}` : ''}
            </p>
            <p className="text-xs text-amber-700">{selectedSlot.start_time} – {selectedSlot.end_time}</p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white">
            <CalendarCheck className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Guest info */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Your Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="user_name">Full Name *</Label>
            <Input id="user_name" placeholder="Ahmad Razif" {...register('user_name')} />
            {errors.user_name && <p className="text-xs text-red-500">{errors.user_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user_phone">Phone Number *</Label>
            <Input id="user_phone" type="tel" placeholder="+60 12-345 6789" {...register('user_phone')} />
            {errors.user_phone && <p className="text-xs text-red-500">{errors.user_phone.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user_email">Email Address *</Label>
          <Input id="user_email" type="email" placeholder="you@example.com" {...register('user_email')} />
          {errors.user_email && <p className="text-xs text-red-500">{errors.user_email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event_name">Event Name *</Label>
          <Input id="event_name" placeholder="e.g. Wedding Reception, Annual Dinner" {...register('event_name')} />
          {errors.event_name && <p className="text-xs text-red-500">{errors.event_name.message}</p>}
        </div>
      </div>

      {/* Date & Time */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Date & Time</h3>
        <div className="space-y-1.5">
          <Label>Event Date *</Label>
          <input type="hidden" {...register('date')} />
          <DatePicker value={selectedDate} onChange={handleDateChange} error={errors.date?.message} />
          {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>
            Time Slot * <span className="text-xs font-normal text-slate-400">— affects total price</span>
          </Label>
          <input type="hidden" {...register('start_time')} />
          <input type="hidden" {...register('end_time')} />
          <SlotPicker slots={timeSlots} value={selectedSlot} onChange={handleSlotChange} error={errors.start_time?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>
            Guest Count * <span className="text-xs font-normal text-slate-400">— affects total price</span>
          </Label>
          <input type="hidden" {...register('guest_count', { valueAsNumber: true })} />
          <input type="hidden" {...register('pax_package_label')} />
          <PaxPicker packages={paxPackages} value={selectedPax} onChange={handlePaxChange} error={errors.pax_package_label?.message} />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea id="notes" placeholder="Special requirements, dietary needs, setup preferences..." {...register('notes')} />
        {errors.notes && <p className="text-xs text-red-500">{errors.notes.message}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <><Spinner size="sm" /> Submitting Booking...</> : 'Submit Booking Request'}
      </Button>
      <p className="text-center text-xs text-slate-500">
        Your booking will be reviewed within 24 hours. You will receive a confirmation email once approved.
      </p>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/booking/booking-form.tsx
git commit -m "feat: update booking form - phone, pax picker, onBlur validation, selected package banner"
```

---

## Task 12: BookEvent — Wire Venue Data to Form

**Files:**
- Modify: `src/components/booking/book-event.tsx`

- [ ] **Step 1: Rewrite book-event.tsx**

```tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Users } from 'lucide-react'
import { BookingForm } from '@/components/booking/booking-form'
import { BookingSummary } from '@/components/booking/booking-summary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VENUE_FALLBACK, TIME_SLOTS_FALLBACK, PAX_PACKAGES_FALLBACK } from '@/lib/constants'
import type { Venue } from '@/types'

interface BookEventProps {
  venue: Venue | null
}

export function BookEvent({ venue }: BookEventProps) {
  if (!venue) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center py-10">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Booking Unavailable</h1>
          <p className="text-slate-500 mb-6">
            We are unable to load venue information at this time. Please try again later or contact us directly.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-amber-600 hover:underline text-sm">
            <ArrowLeft className="h-4 w-4" />
            Return to home
          </Link>
        </div>
      </div>
    )
  }

  const timeSlots = venue.time_slots?.length ? venue.time_slots : TIME_SLOTS_FALLBACK
  const paxPackages = venue.pax_packages?.length ? venue.pax_packages : PAX_PACKAGES_FALLBACK

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Book Your Event</h1>
          <p className="mt-1 text-slate-500">Fill in the details below to submit your booking request.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 sm:p-8">
                <Suspense fallback={<Skeleton className="h-96" />}>
                  <BookingForm venueId={venue.id} timeSlots={timeSlots} paxPackages={paxPackages} />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Venue</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-2">
                <p className="font-semibold text-slate-900">{venue.name}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {venue.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="h-4 w-4 shrink-0" />
                  Up to {venue.capacity} guests
                </div>
              </CardContent>
            </Card>

              <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 text-sm text-amber-800 space-y-1">
                <p className="font-semibold">How it works</p>
                <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
                  <li>Submit your booking request</li>
                  <li>Admin reviews within 24 hours</li>
                  <li>You receive email confirmation</li>
                  <li>Save your reference number</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
```

Wait — the BookingSummary needs `date`, `slot`, and `paxPackage` state from `BookingForm`. Since they're siblings, the cleanest approach is to render `BookingSummary` inside `BookingForm` and position it via CSS. Update `BookingForm` to render `BookingSummary` inline at the bottom on mobile and via a portal/slot on desktop.

**Simpler approach:** render the summary at the bottom of the form on all screen sizes, below the submit button. On desktop the sidebar card area shows only the venue info + how-it-works card.

Update `BookingForm` (Task 11) to add `BookingSummary` just above the submit button:

```tsx
// Add to booking-form.tsx imports:
import { BookingSummary } from './booking-summary'

// Add just before the submit Button in the JSX:
<BookingSummary date={selectedDate} slot={selectedSlot} paxPackage={selectedPax} />
```

And update `book-event.tsx` to remove the `BookingSummaryWrapper` placeholder and clean up the sidebar:

```tsx
// In book-event.tsx sidebar, replace BookingSummaryWrapper with nothing.
// The sidebar shows Venue card + How it works card only.
// BookingSummary is rendered inside BookingForm above the submit button.
```

- [ ] **Step 2: Update booking page to pass venue object**

Update `src/app/(public)/booking/page.tsx`:

```tsx
import { BookEvent } from '@/components/booking/book-event'
import { getVenues } from '@/lib/data/venues'

async function getFirstVenue() {
  try {
    const venues = await getVenues()
    return venues[0] ?? null
  } catch {
    return null
  }
}

export default async function BookingPage() {
  const venue = await getFirstVenue()
  return <BookEvent venue={venue} />
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd f:/dev/venue-booking && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/booking/book-event.tsx src/app/(public)/booking/page.tsx
git commit -m "feat: pass full venue to BookEvent, wire time slots and pax packages to form"
```

---

## Task 13: Landing Page — Pricing from API

**Files:**
- Modify: `src/components/landing-page.tsx`

- [ ] **Step 1: Update LandingPage to accept venue prop and show "from RM X" pricing**

`LandingPage` is a server component. Update `src/app/page.tsx` to fetch the venue and pass it:

```tsx
// src/app/page.tsx
import { getVenues } from '@/lib/data/venues'
import LandingPage from '@/components/landing-page'
import { VENUE_FALLBACK } from '@/lib/constants'

export default async function HomePage() {
  let venue
  try {
    const venues = await getVenues()
    venue = venues[0] ?? null
  } catch {
    venue = null
  }
  return <LandingPage venue={venue} />
}
```

- [ ] **Step 2: Update LandingPage component signature and pricing section**

In `src/components/landing-page.tsx`:

Change the function signature:
```tsx
import type { Venue } from '@/types'
import { TIME_SLOTS_FALLBACK, PAX_PACKAGES_FALLBACK } from '@/lib/constants'

export default function LandingPage({ venue }: { venue: Venue | null }) {
  const v = venue ?? VENUE_FALLBACK
  const timeSlots = venue?.time_slots?.length ? venue.time_slots : TIME_SLOTS_FALLBACK
  const minPaxPrice = Math.min(...(venue?.pax_packages?.length ? venue.pax_packages : PAX_PACKAGES_FALLBACK).map(p => p.price))
  // ...
}
```

Replace the pricing section cards:
```tsx
{/* Pricing */}
<section id="pricing" className="py-20 bg-white">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Transparent Pricing</h2>
      <p className="mt-3 text-lg text-slate-500">Choose the session that fits your event</p>
    </div>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {timeSlots.map((slot) => (
        <Card
          key={slot.label}
          className={slot.label === 'Full Day' ? 'border-amber-300 shadow-md ring-1 ring-amber-300' : ''}
        >
          <CardContent className="p-6">
            {slot.label === 'Full Day' && (
              <div className="mb-3">
                <span className="inline-block rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                  Best Value
                </span>
              </div>
            )}
            <h3 className="text-xl font-bold text-slate-900">{slot.label}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {slot.start_time} – {slot.end_time}
            </p>
            <Separator className="my-4" />
            <div>
              <span className="text-3xl font-bold text-slate-900">
                {formatCurrency(slot.price)}
              </span>
              <span className="ml-1 text-sm text-slate-400">slot only</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Guest package from {formatCurrency(minPaxPrice)} added at booking
            </p>
            <div className="mt-4">
              <Button asChild className="w-full" variant={slot.label === 'Full Day' ? 'default' : 'outline'}>
                <Link href={`/booking?slot=${slot.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  Select
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>
```

Remove the `import { TIME_SLOTS, VENUE_FALLBACK }` and replace with the new imports. Remove unused `formatCurrency` import if it was there (it's still needed).

- [ ] **Step 3: TypeScript check + verify in browser**

```bash
cd f:/dev/venue-booking && npx tsc --noEmit && npm run dev
```
Navigate to `http://localhost:3000`. Verify pricing cards show "slot only" price + guest package note.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing-page.tsx src/app/page.tsx
git commit -m "feat: landing page pricing cards load from venue API, show 'from RM X' pattern"
```

---

## Task 14: Footer — Hidden Admin Login Link

**Files:**
- Modify: `src/components/layout/footer.tsx`

- [ ] **Step 1: Wrap copyright in a silent Link**

In `src/components/layout/footer.tsx`, replace the copyright `<div>`:

```tsx
// Replace:
<div className="mt-10 border-t border-slate-700 pt-6 text-center text-xs text-slate-500">
  © {new Date().getFullYear()} The Grand Hall at Majestic Place. All rights reserved.
</div>

// With:
<div className="mt-10 border-t border-slate-700 pt-6 text-center text-xs text-slate-500">
  <Link href="/login" className="text-slate-500 no-underline hover:text-slate-500">
    © {new Date().getFullYear()} The Grand Hall at Majestic Place. All rights reserved.
  </Link>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/footer.tsx
git commit -m "feat: footer copyright links silently to /login for admin access"
```

---

## Task 15: Admin Dashboard — Total Price Column + Phone

**Files:**
- Modify: `src/components/admin/bookings-table.tsx`

- [ ] **Step 1: Add Total column to desktop table header**

In `src/components/admin/bookings-table.tsx`, in the `<thead>` row, add after the Reference `<th>`:

```tsx
<th className="px-4 py-3">Total</th>
```

- [ ] **Step 2: Add Total cell to each booking row**

In the `<tbody>` rows, after the Reference `<td>`:

```tsx
<td className="px-4 py-3 font-semibold text-slate-900">
  {booking.total_price ? formatCurrency(booking.total_price) : '—'}
</td>
```

Add the `formatCurrency` import at the top:
```ts
import { formatCurrency } from '@/lib/utils'
```

- [ ] **Step 3: Add phone to mobile cards**

In the mobile card view, after the email line:
```tsx
<div className="text-xs text-slate-500">{booking.user_phone || '—'}</div>
```

- [ ] **Step 4: Add guest count + total to expanded view**

In the mobile card's notes expansion area, also show booking price info when expanded:
```tsx
{expandedId === booking.id && (
  <div className="text-xs text-slate-600 bg-slate-50 rounded p-2 space-y-1">
    {booking.notes && <p>{booking.notes}</p>}
    {booking.total_price && (
      <p className="font-semibold text-slate-800">
        Total: {formatCurrency(booking.total_price)}
        {booking.pax_package_label && ` · ${booking.pax_package_label} package`}
        {booking.guest_count && ` · ${booking.guest_count} guests`}
      </p>
    )}
  </div>
)}
```

Update the "Show notes" toggle to show when there are notes OR pricing info:
```tsx
{(booking.notes || booking.total_price) && (
  <button
    type="button"
    onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
    className="text-xs text-amber-600 hover:underline"
  >
    {expandedId === booking.id ? 'Hide details' : 'Show details'}
  </button>
)}
```

- [ ] **Step 5: TypeScript check**

```bash
cd f:/dev/venue-booking && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/bookings-table.tsx
git commit -m "feat: add total price column and guest details to admin bookings table"
```

---

## Task 16: Admin Venue Settings Page

**Files:**
- Create: `src/components/admin/venue-settings.tsx`
- Create: `src/app/(admin)/admin/venue/page.tsx`
- Modify: `src/components/admin/admin-dashboard.tsx`

- [ ] **Step 1: Create venue-settings.tsx**

```tsx
'use client'

import { useState } from 'react'
import { Settings, Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/useToast'
import { updateVenueSettings } from '@/services/venues'
import type { TimeSlot, PaxPackage, Venue } from '@/types'

interface VenueSettingsProps {
  venue: Venue
}

export function VenueSettings({ venue }: VenueSettingsProps) {
  const [slots, setSlots] = useState<TimeSlot[]>(venue.time_slots ?? [])
  const [packages, setPackages] = useState<PaxPackage[]>(venue.pax_packages ?? [])
  const [saving, setSaving] = useState(false)

  function updateSlot(index: number, field: keyof TimeSlot, value: string | number) {
    setSlots((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index))
  }

  function addSlot() {
    setSlots((prev) => [...prev, { label: '', start_time: '08:00', end_time: '12:00', price: 0 }])
  }

  function updatePackage(index: number, field: keyof PaxPackage, value: string | number) {
    setPackages((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function removePackage(index: number) {
    setPackages((prev) => prev.filter((_, i) => i !== index))
  }

  function addPackage() {
    setPackages((prev) => [...prev, { label: '', min_pax: 1, max_pax: 100, price: 0 }])
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateVenueSettings(venue.id, { time_slots: slots, pax_packages: packages })
      toast({ title: 'Venue pricing updated', description: 'Changes apply to all new bookings immediately.' })
    } catch {
      toast({ title: 'Save failed', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-slate-600" />
          <h2 className="text-xl font-bold text-slate-900">Venue Settings</h2>
        </div>
        <p className="text-sm text-slate-500">{venue.name}</p>
      </div>

      {/* Time Slots */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Time Slots</h3>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1fr_90px_90px_100px_40px] gap-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span>Label</span><span>Start</span><span>End</span><span>Price (RM)</span><span />
          </div>
          {slots.map((slot, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_90px_100px_40px] gap-2 items-center rounded-lg bg-slate-50 px-3 py-2">
              <Input value={slot.label} onChange={(e) => updateSlot(i, 'label', e.target.value)} placeholder="Label" className="h-8 text-sm" />
              <Input value={slot.start_time} onChange={(e) => updateSlot(i, 'start_time', e.target.value)} placeholder="08:00" className="h-8 text-sm" />
              <Input value={slot.end_time} onChange={(e) => updateSlot(i, 'end_time', e.target.value)} placeholder="12:00" className="h-8 text-sm" />
              <Input type="number" value={slot.price} onChange={(e) => updateSlot(i, 'price', Number(e.target.value))} className="h-8 text-sm" />
              <button type="button" onClick={() => removeSlot(i)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addSlot} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors">
            <Plus className="h-4 w-4" /> Add Time Slot
          </button>
        </div>
      </section>

      {/* Guest Packages */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Guest Packages</h3>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_100px_40px] gap-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span>Label</span><span>Min Pax</span><span>Max Pax</span><span>Price (RM)</span><span />
          </div>
          {packages.map((pkg, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_100px_40px] gap-2 items-center rounded-lg bg-slate-50 px-3 py-2">
              <Input value={pkg.label} onChange={(e) => updatePackage(i, 'label', e.target.value)} placeholder="Label" className="h-8 text-sm" />
              <Input type="number" value={pkg.min_pax} onChange={(e) => updatePackage(i, 'min_pax', Number(e.target.value))} className="h-8 text-sm" />
              <Input type="number" value={pkg.max_pax} onChange={(e) => updatePackage(i, 'max_pax', Number(e.target.value))} className="h-8 text-sm" />
              <Input type="number" value={pkg.price} onChange={(e) => updatePackage(i, 'price', Number(e.target.value))} className="h-8 text-sm" />
              <button type="button" onClick={() => removePackage(i)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addPackage} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors">
            <Plus className="h-4 w-4" /> Add Guest Package
          </button>
        </div>
      </section>

      <div className="flex items-center gap-4 border-t border-slate-200 pt-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? 'Saving…' : <><Save className="h-4 w-4" /> Save Changes</>}
        </Button>
        <p className="text-xs text-slate-400">Changes apply to new bookings immediately. Existing bookings are unaffected.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create admin venue page**

```tsx
// src/app/(admin)/admin/venue/page.tsx
import { requireAdmin, isAdminResult } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getVenues } from '@/lib/data/venues'
import { VenueSettings } from '@/components/admin/venue-settings'
import { redirect } from 'next/navigation'

export default async function VenuePage() {
  const supabase = await createClient()
  const authResult = await requireAdmin(supabase)
  if (!isAdminResult(authResult)) redirect('/login')

  const venues = await getVenues()
  const venue = venues[0] ?? null

  if (!venue) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">No venue found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <VenueSettings venue={venue} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add Venue Settings nav link to admin dashboard header**

In `src/components/admin/admin-dashboard.tsx`, add a link to the venue settings page in the header area, next to the sign-out button:

```tsx
import Link from 'next/link'
import { Settings } from 'lucide-react'

// Inside the header <div className="flex items-center gap-3">:
<Button asChild variant="ghost" size="sm">
  <Link href="/admin/venue">
    <Settings className="h-4 w-4" />
    <span className="hidden sm:inline">Venue Settings</span>
  </Link>
</Button>
```

- [ ] **Step 4: TypeScript check + manual test**

```bash
cd f:/dev/venue-booking && npx tsc --noEmit && npm run dev
```

Log in as admin → navigate to `/admin/venue` → verify time slots and packages load, edit one field, save → verify toast appears → reload and confirm change persisted.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/venue-settings.tsx src/app/(admin)/admin/venue/page.tsx src/components/admin/admin-dashboard.tsx
git commit -m "feat: add admin venue settings page for time slots and guest packages"
```

---

## Task 17: Final TypeScript + Build Check

- [ ] **Step 1: Full TypeScript check**

```bash
cd f:/dev/venue-booking && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 2: Run all tests**

```bash
cd f:/dev/venue-booking && npx jest --no-coverage
```
Expected: all pass.

- [ ] **Step 3: Production build**

```bash
cd f:/dev/venue-booking && npm run build
```
Expected: build completes with no errors.

- [ ] **Step 4: End-to-end smoke test in browser**

With `npm run dev` running:
1. `http://localhost:3000` — pricing cards show time slots with "slot only" price + guest package note
2. Click "Select" on a pricing card → booking form loads with amber banner showing selected slot
3. Pick a date — verify month navigation (arrows + dropdowns) works, days are clickable
4. Pick a pax tier — verify summary shows slot + pax + total
5. Fill in name, phone (+601x format), email, event name → blur each field → verify error appears for invalid input
6. Submit → verify redirect to confirmation page
7. Go to `http://localhost:3000` → scroll to footer → click copyright text → verify redirect to `/login`
8. Log in as admin → verify bookings show Total column
9. Navigate to Venue Settings → edit a slot price → save → return to homepage → verify new price

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final build verification pass"
```
