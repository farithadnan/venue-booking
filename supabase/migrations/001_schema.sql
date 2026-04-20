-- venues
CREATE TABLE IF NOT EXISTS venues (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  capacity         INTEGER NOT NULL CHECK (capacity > 0),
  price_per_hour   NUMERIC(10, 2) NOT NULL CHECK (price_per_hour >= 0),
  amenities        TEXT[] NOT NULL DEFAULT '{}',
  images           TEXT[] NOT NULL DEFAULT '{}',
  location         TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- bookings
CREATE TABLE IF NOT EXISTS bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id         UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  user_name        TEXT NOT NULL,
  user_email       TEXT NOT NULL,
  event_name       TEXT NOT NULL,
  date             DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  reference_number TEXT NOT NULL UNIQUE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

CREATE INDEX idx_bookings_venue_date   ON bookings (venue_id, date);
CREATE INDEX idx_bookings_status       ON bookings (status);
CREATE INDEX idx_bookings_reference    ON bookings (reference_number);
CREATE INDEX idx_bookings_user_email   ON bookings (user_email);
