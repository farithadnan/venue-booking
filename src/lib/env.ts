import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  RESEND_API_KEY: z.string().optional().transform((v) => v || undefined),
  RESEND_FROM_EMAIL: z.string().optional().transform((v) => v || undefined),
  ADMIN_NOTIFICATION_EMAIL: z.string().optional().transform((v) => v || undefined),
  APP_URL: z.url().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`)
  throw new Error(`Missing or invalid environment variables:\n${missing.join('\n')}`)
}

export const env = parsed.data
