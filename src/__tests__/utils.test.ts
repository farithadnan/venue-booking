import { formatTime, formatCurrency, formatDate } from '@/lib/utils'

describe('formatTime', () => {
  it('formats midnight as 12:00 AM', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
  })

  it('formats noon as 12:00 PM', () => {
    expect(formatTime('12:00')).toBe('12:00 PM')
  })

  it('formats morning hour', () => {
    expect(formatTime('08:00')).toBe('8:00 AM')
  })

  it('formats afternoon hour', () => {
    expect(formatTime('14:30')).toBe('2:30 PM')
  })

  it('formats 11:59 PM correctly', () => {
    expect(formatTime('23:59')).toBe('11:59 PM')
  })

  it('pads minutes with leading zero', () => {
    expect(formatTime('09:05')).toBe('9:05 AM')
  })
})

describe('formatCurrency', () => {
  it('formats whole number in MYR', () => {
    expect(formatCurrency(2000)).toContain('2,000')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0')
  })

  it('includes MYR currency symbol or code', () => {
    const result = formatCurrency(500)
    expect(result.includes('RM') || result.includes('MYR')).toBe(true)
  })
})

describe('formatDate', () => {
  it('formats a known date correctly', () => {
    // Use a fixed date to avoid locale/timezone flakiness
    const result = formatDate('2026-04-21')
    expect(result).toContain('2026')
    expect(result).toContain('April')
    expect(result).toContain('21')
  })

  it('does not shift date due to timezone', () => {
    // A common bug: new Date('2026-01-01') parses as UTC midnight, which
    // may render as Dec 31 in UTC+offset timezones. formatDate avoids this
    // by parsing year/month/day directly.
    const result = formatDate('2026-01-01')
    expect(result).toContain('January')
    expect(result).toContain('1')
    expect(result).toContain('2026')
  })
})
