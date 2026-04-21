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
