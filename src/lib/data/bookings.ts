import { createAdminClient } from '@/lib/supabase/admin'
import type { Booking } from '@/types'

export async function getBookingById(id: string): Promise<Booking | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bookings')
    .select('*, venue:venues(id, name, location)')
    .eq('id', id)
    .single()
  if (error?.code === 'PGRST116') return null
  if (error) throw new Error(error.message)
  return data
}

export async function getBookingByReference(reference: string): Promise<Booking | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bookings')
    .select('*, venue:venues(id, name, location)')
    .eq('reference_number', reference.toUpperCase())
    .single()
  if (error?.code === 'PGRST116') return null
  if (error) throw new Error(error.message)
  return data
}
