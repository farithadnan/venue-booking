export interface TimeSlot {
  label: string
  start_time: string
  end_time: string
  duration: string
  price: number
}

export const TIME_SLOTS: TimeSlot[] = [
  { label: 'Morning', start_time: '08:00', end_time: '12:00', duration: '4 hours', price: 2000 },
  { label: 'Afternoon', start_time: '13:00', end_time: '17:00', duration: '4 hours', price: 2000 },
  { label: 'Evening', start_time: '18:00', end_time: '23:00', duration: '5 hours', price: 2500 },
  { label: 'Full Day', start_time: '08:00', end_time: '23:00', duration: '15 hours', price: 5500 },
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
