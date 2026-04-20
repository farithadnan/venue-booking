import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdminResult, requireAdmin } from '@/lib/auth'
import { createBookingSchema, BOOKING_STATUSES } from '@/lib/validations'
import { logger, newRequestId } from '@/lib/logger'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { sendBookingConfirmation } from '@/lib/email'
import type { NextRequest } from 'next/server'

function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `VB-${timestamp}-${random}`
}

export async function GET(request: NextRequest) {
  const requestId = newRequestId()
  const supabase = await createClient()

  const authResult = await requireAdmin(supabase)
  if (!isAdminResult(authResult)) return authResult

  const { searchParams } = request.nextUrl
  const statusParam = searchParams.get('status')

  if (statusParam !== null && !(BOOKING_STATUSES as readonly string[]).includes(statusParam)) {
    return Response.json({ error: 'Invalid status value' }, { status: 400 })
  }

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const admin = createAdminClient()
  let query = admin
    .from('bookings')
    .select('*, venue:venues(id, name, location)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (statusParam) {
    query = query.eq('status', statusParam)
  }

  const { data, error, count } = await query

  if (error) {
    logger.error('Failed to list bookings', { requestId, error: error.message })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const requestId = newRequestId()

  // Rate limit: 10 booking requests per 15 minutes per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(`booking:${ip}`, { windowMs: 15 * 60 * 1000, max: 10 })

  if (!rl.allowed) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const input = parsed.data
  const supabase = await createClient()

  // Verify venue exists
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('id, name')
    .eq('id', input.venue_id)
    .single()

  if (venueError || !venue) {
    return Response.json({ error: 'Venue not found' }, { status: 404 })
  }

  // Atomic conflict-check + insert with reference number retry (handles 23505)
  let bookingId: string | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase.rpc('create_booking_atomic', {
      p_venue_id: input.venue_id,
      p_user_name: input.user_name,
      p_user_email: input.user_email,
      p_event_name: input.event_name,
      p_date: input.date,
      p_start_time: input.start_time,
      p_end_time: input.end_time,
      p_notes: input.notes ?? null,
      p_reference_number: generateReference(),
    })

    if (!error) {
      bookingId = data as string
      break
    }

    if (error.message.includes('BOOKING_CONFLICT')) {
      return Response.json({ error: 'This time slot is already booked' }, { status: 409 })
    }

    if (error.code !== '23505') {
      logger.error('create_booking_atomic failed', { requestId, error: error.message })
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    // 23505 = reference_number unique violation — retry with a new reference
  }

  if (!bookingId) {
    logger.error('Reference number collision after 3 attempts', { requestId })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    logger.error('Failed to fetch booking after insert', { requestId, bookingId })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  // Fire-and-forget — don't block the response on email delivery
  sendBookingConfirmation({ ...booking, venue_name: venue.name }).catch((err) =>
    logger.error('Failed to send confirmation email', { requestId, error: String(err) })
  )

  return Response.json(booking, { status: 201, headers: rateLimitHeaders(rl) })
}
