import { createBookingSchema, updateVenueSettingsSchema, loginSchema } from '@/lib/validations'

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const futureDate = tomorrow.toISOString().slice(0, 10)

const validBooking = {
  venue_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  user_name: 'Ali Hassan',
  user_email: 'ali@example.com',
  user_phone: '+60123456789',
  event_name: 'Wedding Reception',
  date: futureDate,
  start_time: '08:00',
  end_time: '12:00',
  guest_count: 200,
  pax_package_label: 'Medium',
}

describe('createBookingSchema', () => {
  it('accepts a valid booking', () => {
    expect(createBookingSchema.safeParse(validBooking).success).toBe(true)
  })

  it('accepts booking with optional notes', () => {
    expect(createBookingSchema.safeParse({ ...validBooking, notes: 'Halal food required' }).success).toBe(true)
  })

  it('rejects past date', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, date: '2020-01-01' })
    expect(result.success).toBe(false)
  })

  it('rejects end_time before start_time', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, start_time: '14:00', end_time: '10:00' })
    expect(result.success).toBe(false)
  })

  it('rejects end_time equal to start_time', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, start_time: '10:00', end_time: '10:00' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid phone — no country code or leading zero', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, user_phone: '123456' })
    expect(result.success).toBe(false)
  })

  it('accepts phone with leading zero', () => {
    expect(createBookingSchema.safeParse({ ...validBooking, user_phone: '0123456789' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, user_email: 'notanemail' })
    expect(result.success).toBe(false)
  })

  it('rejects user_name shorter than 2 chars', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, user_name: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects guest_count of 0', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, guest_count: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects empty pax_package_label', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, pax_package_label: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid venue_id format', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, venue_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects notes longer than 1000 chars', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, notes: 'x'.repeat(1001) })
    expect(result.success).toBe(false)
  })
})

describe('updateVenueSettingsSchema', () => {
  const validSlot = { label: 'Morning', start_time: '08:00', end_time: '12:00', price: 2000 }
  const validPkg = { label: 'Small', min_pax: 50, max_pax: 200, price: 1000 }

  it('accepts valid time slots and packages', () => {
    const result = updateVenueSettingsSchema.safeParse({ time_slots: [validSlot], pax_packages: [validPkg] })
    expect(result.success).toBe(true)
  })

  it('rejects empty time_slots array', () => {
    const result = updateVenueSettingsSchema.safeParse({ time_slots: [], pax_packages: [validPkg] })
    expect(result.success).toBe(false)
  })

  it('rejects empty pax_packages array', () => {
    const result = updateVenueSettingsSchema.safeParse({ time_slots: [validSlot], pax_packages: [] })
    expect(result.success).toBe(false)
  })

  it('rejects slot where start_time >= end_time', () => {
    const badSlot = { ...validSlot, start_time: '12:00', end_time: '08:00' }
    const result = updateVenueSettingsSchema.safeParse({ time_slots: [badSlot], pax_packages: [validPkg] })
    expect(result.success).toBe(false)
  })

  it('rejects package where min_pax > max_pax', () => {
    const badPkg = { ...validPkg, min_pax: 300, max_pax: 100 }
    const result = updateVenueSettingsSchema.safeParse({ time_slots: [validSlot], pax_packages: [badPkg] })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = updateVenueSettingsSchema.safeParse({
      time_slots: [{ ...validSlot, price: -1 }],
      pax_packages: [validPkg],
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'admin@example.com', password: 'secret' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'notvalid', password: 'secret' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'admin@example.com', password: '' }).success).toBe(false)
  })
})
