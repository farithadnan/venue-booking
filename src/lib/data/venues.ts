import { createAdminClient } from '@/lib/supabase/admin'
import type { Venue } from '@/types'

export async function getVenues(): Promise<Venue[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('venues').select('*').order('created_at')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getVenue(id: string): Promise<Venue | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('venues').select('*').eq('id', id).single()
  if (error?.code === 'PGRST116') return null
  if (error) throw new Error(error.message)
  return data
}
