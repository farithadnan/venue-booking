import Link from 'next/link'
import { MapPin, Users, Clock, Star, CheckCircle, ArrowRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { TIME_SLOTS_FALLBACK, VENUE_FALLBACK } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

export default function LandingPage() {
  const venue = VENUE_FALLBACK

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-slate-900 py-24 md:py-36">
          <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-600/10 border border-amber-600/20 px-4 py-1.5 text-sm text-amber-400 mb-6">
              <Star className="h-3.5 w-3.5 fill-current" />
              Premier Event Venue in Kuala Lumpur
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              The Grand Hall
              <span className="block text-amber-400">at Majestic Place</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
              An elegant and spacious venue for weddings, corporate events, gala dinners, and private celebrations.
              Capacity up to {venue.capacity} guests.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/booking">
                  <CalendarDays className="h-5 w-5" />
                  Book Your Event
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-600 bg-transparent text-white hover:bg-slate-800 hover:text-white">
                <Link href="#about">
                  Learn More
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="bg-amber-600 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              {[
                { value: '500+', label: 'Guest Capacity' },
                { value: '200+', label: 'Parking Spaces' },
                { value: '15+', label: 'Years of Excellence' },
                { value: '1000+', label: 'Events Hosted' },
              ].map((stat) => (
                <div key={stat.label} className="text-white">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="mt-0.5 text-sm text-amber-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  A Venue That Tells Your Story
                </h2>
                <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                  {venue.description}
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    { icon: MapPin, text: venue.location },
                    { icon: Users, text: `Capacity: up to ${venue.capacity} guests` },
                    { icon: Clock, text: 'Available: 8:00 AM – 11:00 PM daily' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 text-slate-700">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Button asChild>
                    <Link href="/booking">Reserve Your Date</Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {['Weddings', 'Corporate', 'Galas', 'Celebrations'].map((type) => (
                  <div
                    key={type}
                    className="aspect-square rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center"
                  >
                    <span className="text-sm font-medium text-slate-500">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section id="amenities" className="py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">World-Class Amenities</h2>
              <p className="mt-3 text-lg text-slate-500">Everything you need for an unforgettable event</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {venue.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 p-4">
                  <CheckCircle className="h-5 w-5 shrink-0 text-amber-600" />
                  <span className="text-slate-700">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Transparent Pricing</h2>
              <p className="mt-3 text-lg text-slate-500">Choose the session that fits your event</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TIME_SLOTS_FALLBACK.map((slot) => (
                <Card
                  key={slot.label}
                  className={slot.label === 'Full Day' ? 'border-amber-300 shadow-md ring-1 ring-amber-300' : ''}
                >
                  <CardContent className="p-6">
                    {slot.label === 'Full Day' && (
                      <div className="mb-3">
                        <span className="inline-block rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                          Best Value
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-slate-900">{slot.label}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {slot.start_time} – {slot.end_time}
                    </p>
                    <Separator className="my-4" />
                    <div className="text-3xl font-bold text-slate-900">
                      {formatCurrency(slot.price)}
                    </div>
                    <div className="mt-4">
                      <Button asChild className="w-full" variant={slot.label === 'Full Day' ? 'default' : 'outline'}>
                        <Link href={`/booking?slot=${slot.label.toLowerCase().replace(' ', '-')}`}>
                          Select
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-slate-900 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to Make It Memorable?</h2>
            <p className="mt-4 text-lg text-slate-300">
              Submit your booking request today. Our team will confirm your reservation within 24 hours.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/booking">
                  <CalendarDays className="h-5 w-5" />
                  Book Now — It&apos;s Free to Request
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
