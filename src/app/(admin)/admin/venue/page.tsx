import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVenues } from '@/lib/data/venues'
import { VenueSettings } from '@/components/admin/venue-settings'

export default async function VenuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    redirect('/login')
  }

  const venues = await getVenues()
  const venue = venues[0] ?? null

  if (!venue) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">No venue found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <VenueSettings venue={venue} />
      </div>
    </div>
  )
}
