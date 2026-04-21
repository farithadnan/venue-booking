# UI/UX Revamp + Pricing Architecture — Design Spec

**Date:** 2026-04-21  
**Deadline:** 2026-04-26 1:00 PM MYT  
**Scope:** Booking form overhaul, venue-driven pricing, date picker fixes, form validation, admin UX improvements

---

## 1. Summary of Decisions

| # | Issue | Decision |
|---|-------|----------|
| 1 | Pricing cards → booking form feels pointless | Amber banner on form confirms selected package; slot pre-highlighted; live summary sidebar |
| 2 | Date can't navigate to next month | Bug fix: DayPicker `captionLayout="dropdown"` + verify nav button wiring |
| 3 | Date not dynamic (no month/year jump) | Inline calendar with month + year `<select>` dropdowns |
| 4 | Day can't be selected | Bug fix: inspect DayPicker v9 classNames, ensure `day_button` click target is correct |
| 5 | Time slots hardcoded | Slots live in `venues.time_slots JSONB`; constants become fallback only |
| 6 | Pax count affects pricing | New pax tier picker; total = slot price + pax price; both stored on booking |
| 7 | Admin login not discoverable | Footer copyright text is a hidden `<Link href="/login">` (no underline, no special styling) |
| 8 | No dynamic validation | `useForm` mode `"onBlur"`; inline error messages appear on field blur |
| 9 | Full name vs first/last | Keep single `user_name` field (simpler UX, sufficient for confirmations) |
| 10 | Phone number absent | Add `user_phone` — required; admin needs it to contact customer |

---

## 2. Data Model Changes

### 2a. `venues` table — two new JSONB columns

```sql
ALTER TABLE venues
  ADD COLUMN time_slots    JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN pax_packages  JSONB NOT NULL DEFAULT '[]';
```

**`time_slots` shape:**
```json
[
  { "label": "Morning",   "start_time": "08:00", "end_time": "12:00", "price": 2000 },
  { "label": "Afternoon", "start_time": "13:00", "end_time": "17:00", "price": 2000 },
  { "label": "Evening",   "start_time": "18:00", "end_time": "23:00", "price": 2500 },
  { "label": "Full Day",  "start_time": "08:00", "end_time": "23:00", "price": 5500 }
]
```

**`pax_packages` shape:**
```json
[
  { "label": "Small",  "min_pax": 50,  "max_pax": 200,  "price": 1000 },
  { "label": "Medium", "min_pax": 201, "max_pax": 400,  "price": 2500 },
  { "label": "Large",  "min_pax": 401, "max_pax": 600,  "price": 4500 },
  { "label": "Grand",  "min_pax": 601, "max_pax": 1000, "price": 7000 }
]
```

### 2b. `bookings` table — new columns

```sql
ALTER TABLE bookings
  ADD COLUMN user_phone         TEXT NOT NULL DEFAULT '',
  ADD COLUMN guest_count        INTEGER,
  ADD COLUMN pax_package_label  TEXT,
  ADD COLUMN slot_price         NUMERIC(10,2),
  ADD COLUMN pax_price          NUMERIC(10,2),
  ADD COLUMN total_price        NUMERIC(10,2);
```

**Why snapshot prices:** If admin changes venue pricing later, historical bookings retain the price that was shown to the guest at submission time.

### 2c. `create_booking_atomic` Postgres function

Update to accept and INSERT the new columns: `user_phone`, `guest_count`, `pax_package_label`, `slot_price`, `pax_price`, `total_price`. Price is **validated server-side** by re-fetching the venue's time_slots and pax_packages and recalculating — the client total is for display only, never trusted.

### 2d. Seed data

Update the venue seed / migration to populate `time_slots` and `pax_packages` with the default values above so the app works immediately after migration.

---

## 3. Booking Form

### 3a. Fields (in order)

**Your Details section**
| Field | Type | Validation |
|-------|------|-----------|
| Full Name | text | required, 2–100 chars |
| Phone Number | tel | required, valid MY phone (e.g. `+601x-xxxxxxx` or `01x-xxxxxxx`) |
| Email Address | email | required, valid email |
| Event Name | text | required, 2–200 chars |

**Date & Time section**
| Field | Type | Validation |
|-------|------|-----------|
| Event Date | inline calendar | required, today or future |
| Time Slot | card picker | required, from venue `time_slots` |
| Guest Count | card picker | required, from venue `pax_packages` |

**Additional Notes** — optional textarea, max 1000 chars.

### 3b. Validation mode

`useForm({ mode: 'onBlur' })` — errors appear when a field loses focus, not on every keystroke. Submit still re-validates all fields.

### 3c. Date picker

- Component: `react-day-picker` v9, `mode="single"`, `captionLayout="dropdown"`
- Always visible inline (not a popover)
- `disabled={{ before: today }}` — past dates greyed out, not clickable
- Day cells: minimum `h-9` (36px), `w-full`, comfortable touch target
- Month/year dropdowns use native `<select>` styled to match the app

### 3d. Slot + Pax pickers

- Fetched from venue API (`GET /api/v1/venues/:id`) — not from `constants.ts`
- Each card shows: label, time range (slots) or pax range (packages), `+ RM X`
- Selected card: amber border + amber tint background + checkmark
- Hint text below label: `— affects total price`

### 3e. Selected package banner

Shown when arriving from homepage pricing card (`?slot=` query param):
- Amber `#fef3c7` background, amber border
- Shows: label, price, time range
- Amber filled circle with ✓
- Updates to reflect the new slot if user changes their selection (banner always shows the currently selected slot)

### 3f. Booking summary sidebar (desktop) / below form (mobile)

Live updates on every slot, pax, or date change. No "LIVE" indicator.

| Row | Content |
|-----|---------|
| Date | Selected date or "—" |
| Time Slot | Label + time range |
| Guests | Pax tier label + range |
| *(divider)* | |
| Time Slot | RM X |
| Guest Package | RM X |
| *(divider)* | |
| **Total** | **RM X** (amber, 22px) |

Shows "—" for unselected fields. Total only shows once both slot and pax are selected.

---

## 4. Homepage Pricing Section

Replace current 4 fixed-price cards with time slot cards showing **"from RM X"**:
- Price shown = slot price only (minimum — pax adds on top)
- Subtitle: "Guest package from RM X added at booking"
- "Select" button links to `/booking?slot=<label>` as before
- Slots loaded from venue API (not `constants.ts`)

---

## 5. Admin: Venue Settings Page

New page at `/admin/venue` accessible from the admin dashboard nav.

### Time Slots table
Columns: Label | Start | End | Price | Delete (×)
- Edit-on-click: clicking a row makes its cells editable in place
- Add row at the bottom (blank inputs + `+` button)
- Save Changes button — PATCH `/api/v1/venues/:id`

### Guest Packages table
Columns: Label | Min Pax | Max Pax | Price | Delete (×)
- Same interaction pattern as time slots
- Validation: min_pax < max_pax, no overlapping ranges

### Save behaviour
- Optimistic save with toast: "Venue pricing updated"
- Changes take effect on all new bookings immediately
- Warning: "Existing bookings are not affected — prices were recorded at submission"

---

## 6. Admin Dashboard Updates

- Bookings table: add **Total** column showing `total_price`
- Booking detail / expand: show `guest_count`, `pax_package_label`, `slot_price`, `pax_price`, `total_price`, `user_phone`

---

## 7. Admin Login Discoverability

Footer copyright line becomes a silent link:
```tsx
<Link href="/login" className="text-slate-400 hover:text-slate-400">
  © 2026 The Grand Hall at Majestic Place
</Link>
```
No underline. No colour change on hover. Admin knows to click it; guests never notice.

---

## 8. Zod Schema Updates (`src/lib/validations.ts`)

```ts
// createBookingSchema additions
user_phone: z.string().regex(/^(\+?60|0)\d{8,10}$/, 'Invalid Malaysian phone number'),
guest_count: z.number().int().min(1).max(10000),
pax_package_label: z.string().min(1),
```

Client sends `guest_count` (exact number, e.g. 450) and `pax_package_label` (e.g. "Large"). Client does **not** send prices. The server re-fetches the venue, finds the matching slot by `start_time`/`end_time`, finds the matching pax package by `pax_package_label`, validates that `guest_count` falls within `min_pax`–`max_pax`, then derives and inserts `slot_price`, `pax_price`, `total_price` itself.

---

## 9. `constants.ts` Role After Migration

`TIME_SLOTS` stays as a **UI fallback only** — used when the venue API returns empty `time_slots` (e.g. during development before seed data is applied). All production paths use venue data from the API.

---

## 10. Files Affected

| File | Change |
|------|--------|
| `supabase/migrations/005_pricing.sql` | New — alter venues + bookings, update seed |
| `supabase/migrations/006_atomic_booking_v2.sql` | New — update `create_booking_atomic` |
| `src/lib/validations.ts` | Add phone, pax, price fields |
| `src/lib/constants.ts` | Demote TIME_SLOTS to fallback only |
| `src/types/index.ts` | Update `Venue` and `Booking` types |
| `src/components/booking/booking-form.tsx` | Add phone, pax picker, live summary, onBlur |
| `src/components/booking/date-picker.tsx` | Fix nav bug, add dropdown caption, bigger cells |
| `src/components/booking/slot-picker.tsx` | Accept slots from props (not constants) |
| `src/components/booking/pax-picker.tsx` | New component |
| `src/components/booking/booking-summary.tsx` | New sidebar component |
| `src/components/booking/book-event.tsx` | Fetch venue, pass slots + pax to form |
| `src/components/landing-page.tsx` | Pricing cards → "from RM X", load from API |
| `src/components/layout/footer.tsx` | Copyright → hidden link to /login |
| `src/components/admin/admin-dashboard.tsx` | Add total_price column, nav to venue settings |
| `src/components/admin/venue-settings.tsx` | New — time slots + pax packages editor |
| `src/app/(admin)/admin/venue/page.tsx` | New admin page |
| `src/app/api/v1/venues/[id]/route.ts` | Add PATCH handler for venue settings |
