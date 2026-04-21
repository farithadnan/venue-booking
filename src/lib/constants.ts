import type { TimeSlot, PaxPackage } from '@/types'

export const TIME_SLOTS_FALLBACK: TimeSlot[] = [
  { label: 'Morning',   start_time: '08:00', end_time: '12:00', price: 2000 },
  { label: 'Afternoon', start_time: '13:00', end_time: '17:00', price: 2000 },
  { label: 'Evening',   start_time: '18:00', end_time: '23:00', price: 2500 },
  { label: 'Full Day',  start_time: '08:00', end_time: '23:00', price: 5500 },
]

export const PAX_PACKAGES_FALLBACK: PaxPackage[] = [
  { label: 'Small',  min_pax: 50,  max_pax: 200,  price: 1000 },
  { label: 'Medium', min_pax: 201, max_pax: 400,  price: 2500 },
  { label: 'Large',  min_pax: 401, max_pax: 600,  price: 4500 },
  { label: 'Grand',  min_pax: 601, max_pax: 1000, price: 7000 },
]

export const VENUE_FALLBACK = {
  id: '',
  name: 'The Grand Hall at Majestic Place',
  description:
    'An elegant and spacious event hall nestled in the heart of the city, perfect for weddings, corporate events, gala dinners, and private celebrations. The Grand Hall combines timeless architecture with modern amenities to create an unforgettable setting for your most important occasions.',
  capacity: 500,
  price_per_hour: 500,
  amenities: [
    'Air Conditioning',
    'Stage & Podium',
    'Sound System',
    'Projector & Screen',
    'Catering Kitchen',
    'Bridal Suite',
    'Parking for 200 cars',
    'High-Speed WiFi',
    'Dedicated Event Coordinator',
    'Security Personnel',
  ],
  images: [],
  location: 'Majestic Place, Kuala Lumpur',
  created_at: '',
  time_slots: [],
  pax_packages: [],
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
}
