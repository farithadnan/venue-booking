import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(`lookup:${ip}`, { windowMs: 15 * 60 * 1000, max: 20 })

  if (!rl.allowed) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  const reference = request.nextUrl.searchParams.get('reference')?.trim()

  if (!reference) {
    return Response.json({ error: 'Missing required query param: reference' }, { status: 400 })
  }

  // Reference numbers are uppercase — normalise to prevent trivial misses
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('bookings')
    .select('*, venue:venues(id, name, location)')
    .eq('reference_number', reference.toUpperCase())
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ error: 'Booking not found' }, { status: 404, headers: rateLimitHeaders(rl) })
    }
    logger.error('Failed to lookup booking by reference', { error: error.message })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json(data, { headers: rateLimitHeaders(rl) })
}
