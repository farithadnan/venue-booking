import type { Venue } from '@/types'
import { apiFetch } from './api'

export async function fetchVenues(): Promise<Venue[]> {
  return apiFetch<Venue[]>('/api/v1/venues')
}

export async function fetchVenue(id: string): Promise<Venue> {
  return apiFetch<Venue>(`/api/v1/venues/${id}`)
}
