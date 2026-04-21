-- supabase/migrations/006_atomic_booking_v2.sql

-- Drop all overloads so CREATE OR REPLACE has no ambiguity
DROP FUNCTION IF EXISTS create_booking_atomic CASCADE;

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
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION create_booking_atomic TO anon, authenticated;
