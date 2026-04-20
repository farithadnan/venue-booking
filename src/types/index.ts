export type BookingStatus = 'pending' | 'approved' | 'rejected'

export interface Venue {
  id: string
  name: string
  description: string
  capacity: number
  price_per_hour: number
  amenities: string[]
  images: string[]
  location: string
  created_at: string
}

export interface Booking {
  id: string
  venue_id: string
  user_name: string
  user_email: string
  event_name: string
  date: string
  start_time: string
  end_time: string
  status: BookingStatus
  reference_number: string
  notes: string | null
  created_at: string
  venue?: Pick<Venue, 'id' | 'name' | 'location'>
}

export type { CreateBookingInput } from '@/lib/validations'
