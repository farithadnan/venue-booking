import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Users } from 'lucide-react'
import { BookingForm } from '@/components/booking/booking-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TIME_SLOTS_FALLBACK, PAX_PACKAGES_FALLBACK } from '@/lib/constants'
import type { Venue } from '@/types'

interface BookEventProps {
  venue: Venue | null
}

export function BookEvent({ venue }: BookEventProps) {
  if (!venue) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center py-10">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Booking Unavailable</h1>
          <p className="text-slate-500 mb-6">
            We are unable to load venue information at this time. Please try again later or contact us
            directly.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-amber-600 hover:underline text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to home
          </Link>
        </div>
      </div>
    )
  }

  const timeSlots = venue.time_slots?.length ? venue.time_slots : TIME_SLOTS_FALLBACK
  const paxPackages = venue.pax_packages?.length ? venue.pax_packages : PAX_PACKAGES_FALLBACK

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Book Your Event</h1>
          <p className="mt-1 text-slate-500">Fill in the details below to submit your booking request.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 sm:p-8">
                <Suspense fallback={<Skeleton className="h-96" />}>
                  <BookingForm venueId={venue.id} timeSlots={timeSlots} paxPackages={paxPackages} />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Venue</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <p className="font-semibold text-slate-900">{venue.name}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {venue.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="h-4 w-4 shrink-0" />
                  Up to {venue.capacity} guests
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 text-sm text-amber-800 space-y-1">
                <p className="font-semibold">How it works</p>
                <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
                  <li>Submit your booking request</li>
                  <li>Admin reviews within 24 hours</li>
                  <li>You receive email confirmation</li>
                  <li>Save your reference number</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
