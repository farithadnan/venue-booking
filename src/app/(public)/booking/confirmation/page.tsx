import { notFound } from 'next/navigation'
import { BookingConfirmation } from '@/components/booking/booking-confirmation'
import { getBookingById, getBookingByReference } from '@/lib/data/bookings'
import type { Booking } from '@/types'

async function resolveBooking(id: string | undefined, ref: string | undefined): Promise<Booking | null> {
  if (id) return getBookingById(id).catch(() => null)
  if (ref) return getBookingByReference(ref).catch(() => null)
  return null
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; ref?: string }>
}) {
  const params = await searchParams
  const booking = await resolveBooking(params.id, params.ref)
  if (!booking) notFound()
  return <BookingConfirmation booking={booking} />
}
