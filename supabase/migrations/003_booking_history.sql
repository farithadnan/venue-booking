-- Audit trail: one row per status change
CREATE TABLE IF NOT EXISTS booking_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  changed_by      TEXT,           -- admin email
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_booking_id ON booking_status_history (booking_id);

-- Only the service role may read or write history
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "history_service_role_only"
  ON booking_status_history FOR ALL
  USING (auth.role() = 'service_role');
