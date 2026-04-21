import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminLoginForm } from '@/components/admin/admin-login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.role === 'admin') redirect('/admin/dashboard')
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
          <p className="mt-1 text-sm text-slate-500">The Grand Hall at Majestic Place</p>
        </div>
        <Suspense>
          <AdminLoginForm />
        </Suspense>
        <p className="mt-4 text-center text-xs text-slate-400">
          Admin access only.{' '}
          <a href="/" className="text-amber-600 hover:underline">
            Return to site
          </a>
        </p>
      </div>
    </div>
  )
}
