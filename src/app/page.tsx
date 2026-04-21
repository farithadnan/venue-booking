import { getVenues } from '@/lib/data/venues'
import LandingPage from '@/components/landing-page'

export default async function HomePage() {
  let venue = null
  try {
    const venues = await getVenues()
    venue = venues[0] ?? null
  } catch {
    venue = null
  }
  return <LandingPage venue={venue} />
}
