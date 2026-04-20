import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdminResult, requireAdmin } from '@/lib/auth'
import { updateBookingStatusSchema } from '@/lib/validations'
import { logger, newRequestId } from '@/lib/logger'
import { sendBookingStatusUpdate } from '@/lib/email'
import { UUID_REGEX } from '@/lib/utils'
import type { NextRequest } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('bookings')
    .select('*, venue:venues(id, name, location)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return Response.json({ error: 'Not found' }, { status: 404 })
    logger.error('Failed to fetch booking', { bookingId: id, error: error.message })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = newRequestId()
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createClient()
  const authResult = await requireAdmin(supabase)
  if (!isAdminResult(authResult)) return authResult

  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateBookingStatusSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const admin = createAdminClient()

  const { data: current, error: fetchError } = await admin
    .from('bookings')
    .select('*, venue:venues(id, name, location)')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') return Response.json({ error: 'Not found' }, { status: 404 })
    logger.error('Failed to fetch booking before update', { requestId, error: fetchError.message })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  if (current.status !== 'pending') {
    return Response.json(
      { error: `Booking is already ${current.status} and cannot be changed` },
      { status: 422 }
    )
  }

  const { data: updated, error: updateError } = await admin
    .from('bookings')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    logger.error('Failed to update booking status', { requestId, error: updateError.message })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  admin
    .from('booking_status_history')
    .insert({
      booking_id: id,
      from_status: current.status,
      to_status: parsed.data.status,
      changed_by: authResult.user.email ?? null,
    })
    .then(({ error: histErr }) => {
      if (histErr) logger.error('Failed to write booking history', { requestId, error: histErr.message })
    })

  const venueName = (current.venue as { name: string } | null)?.name ?? ''
  sendBookingStatusUpdate({ ...updated, venue_name: venueName }).catch((err) =>
    logger.error('Failed to send status update email', { requestId, error: String(err) })
  )

  return Response.json(updated)
}
