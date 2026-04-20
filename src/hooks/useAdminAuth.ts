'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login, logout } from '@/services/auth'
import { ApiError } from '@/services/api'

interface State {
  loading: boolean
  error: string | null
}

export function useAdminAuth() {
  const [state, setState] = useState<State>({ loading: false, error: null })
  const router = useRouter()
  const searchParams = useSearchParams()

  async function signIn(email: string, password: string): Promise<void> {
    setState({ loading: true, error: null })
    try {
      await login(email, password)
      const redirectTo = searchParams.get('redirectTo') ?? '/admin/dashboard'
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 429
          ? 'Too many login attempts. Please try again later.'
          : err instanceof ApiError && err.status === 401
            ? 'Invalid email or password.'
            : 'Login failed. Please try again.'
      setState({ loading: false, error: message })
    }
  }

  async function signOut(): Promise<void> {
    await logout().catch(() => null)
    router.push('/login')
    router.refresh()
  }

  return { ...state, signIn, signOut }
}
