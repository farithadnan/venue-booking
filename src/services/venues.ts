import type { Venue } from '@/types'
import type { UpdateVenueSettingsInput } from '@/lib/validations'
import { apiFetch } from './api'

export async function fetchVenues(): Promise<Venue[]> {
  return apiFetch<Venue[]>('/api/v1/venues')
}

export async function fetchVenue(id: string): Promise<Venue> {
  return apiFetch<Venue>(`/api/v1/venues/${id}`)
}

export async function updateVenueSettings(id: string, input: UpdateVenueSettingsInput): Promise<Venue> {
  return apiFetch<Venue>(`/api/v1/venues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
