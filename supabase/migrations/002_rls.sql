-- venues: anyone can read, only service role can write
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venues_public_read"
  ON venues FOR SELECT
  USING (true);

CREATE POLICY "venues_service_role_write"
  ON venues FOR ALL
  USING (auth.role() = 'service_role');

-- bookings: anyone can INSERT (guest booking flow, no account required);
-- SELECT and UPDATE are restricted to the service role — all reads go through
-- our API which uses the admin client, so the anon key cannot be used to
-- enumerate bookings directly via PostgREST
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_public_insert"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "bookings_service_role_select"
  ON bookings FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "bookings_service_role_update"
  ON bookings FOR UPDATE
  USING (auth.role() = 'service_role');
