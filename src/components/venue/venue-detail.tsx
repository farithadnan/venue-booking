import Link from 'next/link'
import { ArrowLeft, MapPin, Users, CheckCircle, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TIME_SLOTS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { Venue } from '@/types'

export function VenueDetail({ venue }: { venue: Venue }) {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-slate-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">{venue.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {venue.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Up to {venue.capacity} guests
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-3">About This Venue</h2>
                <p className="text-slate-600 leading-relaxed">{venue.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {venue.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span className="text-slate-700 text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Pricing</h2>
                <div className="space-y-3">
                  {TIME_SLOTS.map((slot, i) => (
                    <div key={slot.label}>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="font-semibold text-slate-900">{slot.label}</span>
                          <span className="ml-3 text-sm text-slate-500">
                            {slot.start_time} – {slot.end_time}
                          </span>
                          <span className="ml-2 text-xs text-slate-400">({slot.duration})</span>
                        </div>
                        <span className="font-bold text-slate-900">{formatCurrency(slot.price)}</span>
                      </div>
                      {i < TIME_SLOTS.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="sticky top-20">
              <Card className="border-amber-200">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Reserve This Venue</h3>
                  <p className="text-sm text-slate-500">
                    Choose your preferred time slot and submit a booking request. Our team reviews all
                    requests within 24 hours.
                  </p>
                  <div className="space-y-2">
                    {TIME_SLOTS.map((slot) => (
                      <Button
                        key={slot.label}
                        asChild
                        variant="outline"
                        className="w-full justify-between text-sm"
                      >
                        <Link
                          href={`/booking?venueId=${venue.id}&slot=${slot.label.toLowerCase().replace(' ', '-')}`}
                        >
                          <span>
                            {slot.label}{' '}
                            <span className="text-slate-400 text-xs ml-1">
                              {slot.start_time}–{slot.end_time}
                            </span>
                          </span>
                          <span className="font-bold">{formatCurrency(slot.price)}</span>
                        </Link>
                      </Button>
                    ))}
                  </div>
                  <Separator />
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/booking?venueId=${venue.id}`}>
                      <CalendarDays className="h-4 w-4" />
                      Book Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
