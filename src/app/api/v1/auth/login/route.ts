import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations'
import { logger, newRequestId } from '@/lib/logger'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const requestId = newRequestId()

  // Tight rate limit on login attempts to slow brute-force
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(`login:${ip}`, { windowMs: 15 * 60 * 1000, max: 10 })

  if (!rl.allowed) {
    return Response.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 422 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Use the same message for wrong email and wrong password — no enumeration
    logger.warn('Login failed', { requestId, ip, reason: error.message })
    return Response.json(
      { error: 'Invalid email or password' },
      { status: 401, headers: rateLimitHeaders(rl) }
    )
  }

  if (data.user.app_metadata?.role !== 'admin') {
    await supabase.auth.signOut()
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  return Response.json({ user: { id: data.user.id, email: data.user.email } })
}
