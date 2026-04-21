export type BookingStatus = 'pending' | 'approved' | 'rejected'

export interface TimeSlot {
  label: string
  start_time: string
  end_time: string
  price: number
}

export interface PaxPackage {
  label: string
  min_pax: number
  max_pax: number
  price: number
}

export interface Venue {
  id: string
  name: string
  description: string
  capacity: number
  price_per_hour: number
  amenities: string[]
  images: string[]
  location: string
  time_slots: TimeSlot[]
  pax_packages: PaxPackage[]
  created_at: string
}

export interface Booking {
  id: string
  venue_id: string
  user_name: string
  user_email: string
  user_phone: string
  event_name: string
  date: string
  start_time: string
  end_time: string
  status: BookingStatus
  reference_number: string
  notes: string | null
  guest_count: number | null
  pax_package_label: string | null
  slot_price: number | null
  pax_price: number | null
  total_price: number | null
  created_at: string
  venue?: Pick<Venue, 'id' | 'name' | 'location'>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  error: string
}

export type BookingWithVenue = Booking & {
  venue: Pick<Venue, 'id' | 'name' | 'location'>
}

export type { CreateBookingInput, UpdateBookingStatusInput } from '@/lib/validations'
