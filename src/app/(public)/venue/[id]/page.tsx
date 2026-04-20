import { notFound } from 'next/navigation'
import { VenueDetail } from '@/components/venue/venue-detail'
import { getVenue } from '@/lib/data/venues'

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let venue
  try {
    venue = await getVenue(id)
  } catch {
    venue = null
  }
  if (!venue) notFound()
  return <VenueDetail venue={venue} />
}
