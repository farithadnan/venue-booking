import Link from 'next/link'
import { MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex flex-col leading-tight group">
            <span className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
              The Grand Hall
            </span>
            <span className="text-xs text-slate-500 -mt-0.5">at Majestic Place</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/#about" className="hover:text-slate-900 transition-colors">About</Link>
            <Link href="/#amenities" className="hover:text-slate-900 transition-colors">Amenities</Link>
            <Link href="/#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
          </nav>

          <Button asChild size="default">
            <Link href="/booking">Book Now</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
