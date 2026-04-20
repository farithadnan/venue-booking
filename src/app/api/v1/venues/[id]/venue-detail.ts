import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
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
