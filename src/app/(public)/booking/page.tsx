import { BookEvent } from '@/components/booking/book-event'
import { getVenues } from '@/lib/data/venues'
import type { Venue } from '@/types'

async function getFirstVenue(): Promise<Venue | null> {
  try {
    const venues = await getVenues()
    return venues[0] ?? null
  } catch {
    return null
  }
}

export default async function BookingPage() {
  const venue = await getFirstVenue()
  return <BookEvent venue={venue} />
}
