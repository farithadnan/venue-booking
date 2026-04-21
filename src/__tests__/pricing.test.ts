import { deriveBookingPrice } from '@/lib/utils'
import type { TimeSlot, PaxPackage } from '@/types'

const slots: TimeSlot[] = [
  { label: 'Morning', start_time: '08:00', end_time: '12:00', price: 2000 },
  { label: 'Evening', start_time: '18:00', end_time: '23:00', price: 2500 },
]
const packages: PaxPackage[] = [
  { label: 'Small',  min_pax: 50,  max_pax: 200, price: 1000 },
  { label: 'Large',  min_pax: 401, max_pax: 600, price: 4500 },
]

describe('deriveBookingPrice', () => {
  it('returns null when slot not found', () => {
    expect(deriveBookingPrice('09:00', '13:00', 'Small', slots, packages)).toBeNull()
  })

  it('returns null when package not found', () => {
    expect(deriveBookingPrice('08:00', '12:00', 'Grand', slots, packages)).toBeNull()
  })

  it('returns correct prices for valid slot + package', () => {
    const result = deriveBookingPrice('08:00', '12:00', 'Small', slots, packages)
    expect(result).toEqual({ slotPrice: 2000, paxPrice: 1000, totalPrice: 3000 })
  })

  it('adds Evening slot price to Large package', () => {
    const result = deriveBookingPrice('18:00', '23:00', 'Large', slots, packages)
    expect(result).toEqual({ slotPrice: 2500, paxPrice: 4500, totalPrice: 7000 })
  })
})
