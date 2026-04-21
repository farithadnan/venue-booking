import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { UUID_REGEX } from '@/lib/utils'
import { updateVenueSettingsSchema } from '@/lib/validations'
import { requireAdmin, isAdminResult } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return Response.json({ error: 'Not found' }, { status: 404 })
    logger.error('Failed to fetch venue', { venueId: id, error: error.message })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createClient()
  const adminResult = await requireAdmin(supabase)

  if (!isAdminResult(adminResult)) {
    return adminResult
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateVenueSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('venues')
    .update({
      time_slots: parsed.data.time_slots,
      pax_packages: parsed.data.pax_packages,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return Response.json({ error: 'Not found' }, { status: 404 })
    logger.error('Failed to update venue settings', { venueId: id, error: error.message })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json(data)
}
