import { apiFetch } from './api'

export interface AdminUser {
  id: string
  email: string
}

export async function login(email: string, password: string): Promise<AdminUser> {
  const data = await apiFetch<{ user: AdminUser }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return data.user
}

export async function logout(): Promise<void> {
  await apiFetch('/api/v1/auth/logout', { method: 'POST' })
}
