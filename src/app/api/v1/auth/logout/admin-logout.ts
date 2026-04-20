import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function POST() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    logger.error('Logout failed', { error: error.message })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json({ success: true })
}
