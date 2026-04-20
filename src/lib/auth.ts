import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

type AdminResult = { user: User } | Response

export async function requireAdmin(supabase: SupabaseClient): Promise<AdminResult> {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.app_metadata?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { user }
}

export function isAdminResult(result: AdminResult): result is { user: User } {
  return !(result instanceof Response)
}
