-- Atomically checks for time-slot conflicts then inserts the booking.
-- Returns the new booking's UUID.
-- Raises 'BOOKING_CONFLICT' if the slot is taken by an approved booking.
-- Reference-number uniqueness is enforced by the table constraint (23505).
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_venue_id         UUID,
  p_user_name        TEXT,
  p_user_email       TEXT,
  p_event_name       TEXT,
  p_date             DATE,
  p_start_time       TIME,
  p_end_time         TIME,
  p_notes            TEXT,
  p_reference_number TEXT
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
    SELECT 1
    FROM bookings
    WHERE venue_id   = p_venue_id
      AND date       = p_date
      AND status     = 'approved'
      AND start_time < p_end_time
      AND end_time   > p_start_time
  ) THEN
    RAISE EXCEPTION 'BOOKING_CONFLICT';
  END IF;

  INSERT INTO bookings (
    venue_id, user_name, user_email, event_name,
    date, start_time, end_time, notes, reference_number, status
  ) VALUES (
    p_venue_id, p_user_name, p_user_email, p_event_name,
    p_date, p_start_time, p_end_time, p_notes, p_reference_number, 'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
