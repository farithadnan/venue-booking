import type { Booking, PaginatedResponse } from '@/types'
import type { CreateBookingInput, UpdateBookingStatusInput } from '@/lib/validations'
import { apiFetch } from './api'

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  return apiFetch<Booking>('/api/v1/bookings', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function lookupBooking(reference: string): Promise<Booking> {
  return apiFetch<Booking>(`/api/v1/bookings/lookup?reference=${encodeURIComponent(reference)}`)
}

export async function fetchBooking(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/api/v1/bookings/${id}`)
}

export interface FetchBookingsParams {
  status?: string
  page?: number
  limit?: number
}

export async function fetchBookings(params: FetchBookingsParams = {}): Promise<PaginatedResponse<Booking>> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  return apiFetch<PaginatedResponse<Booking>>(`/api/v1/bookings?${query}`)
}

export async function updateBookingStatus(id: string, input: UpdateBookingStatusInput): Promise<Booking> {
  return apiFetch<Booking>(`/api/v1/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
