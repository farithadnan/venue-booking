import { BookEvent } from '@/components/booking/book-event'
import { getVenues } from '@/lib/data/venues'

async function getFirstVenueId(): Promise<string> {
  try {
    const venues = await getVenues()
    return venues[0]?.id ?? ''
  } catch {
    return ''
  }
}

export default async function BookingPage() {
  const venueId = await getFirstVenueId()
  return <BookEvent venueId={venueId} />
}
