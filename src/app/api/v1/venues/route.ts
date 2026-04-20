import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('id, name, description, capacity, price_per_hour, amenities, images, location, created_at')
    .order('name')

  if (error) {
    logger.error('Failed to list venues', { error: error.message })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json(data)
}
