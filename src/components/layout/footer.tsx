import Link from 'next/link'
import { MapPin, Phone, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">The Grand Hall</h3>
            <p className="text-sm leading-relaxed">
              An elegant and spacious event venue at the heart of Kuala Lumpur — perfect for weddings,
              corporate events, and private celebrations.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
                Majestic Place, Kuala Lumpur
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-amber-400" />
                +60 3-1234 5678
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-amber-400" />
                events@grandhall.my
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/booking" className="hover:text-white transition-colors">Book an Event</Link></li>
              <li><Link href="/#amenities" className="hover:text-white transition-colors">Amenities</Link></li>
              <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-700 pt-6 text-center text-xs text-slate-500">
          <Link href="/login" className="text-slate-500 no-underline hover:text-slate-500">
            © {new Date().getFullYear()} The Grand Hall at Majestic Place. All rights reserved.
          </Link>
        </div>
      </div>
    </footer>
  )
}
