import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

// Each test gets a unique key so the shared in-memory store doesn't bleed between tests
let counter = 0
function uniqueKey() {
  return `test-key-${++counter}-${Date.now()}`
}

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    const result = checkRateLimit(uniqueKey(), { windowMs: 60_000, max: 5 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('allows requests up to the max', () => {
    const key = uniqueKey()
    const opts = { windowMs: 60_000, max: 3 }
    expect(checkRateLimit(key, opts).allowed).toBe(true)
    expect(checkRateLimit(key, opts).allowed).toBe(true)
    expect(checkRateLimit(key, opts).allowed).toBe(true)
  })

  it('blocks the request after max is exceeded', () => {
    const key = uniqueKey()
    const opts = { windowMs: 60_000, max: 2 }
    checkRateLimit(key, opts)
    checkRateLimit(key, opts)
    const result = checkRateLimit(key, opts)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resets after the window expires', () => {
    const key = uniqueKey()
    // Use a 1ms window so it expires immediately
    checkRateLimit(key, { windowMs: 1, max: 1 })
    checkRateLimit(key, { windowMs: 1, max: 1 }) // exceeds limit

    // Wait for the window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = checkRateLimit(key, { windowMs: 1, max: 1 })
        expect(result.allowed).toBe(true)
        resolve()
      }, 10)
    })
  })

  it('returns a resetAt timestamp in the future', () => {
    const before = Date.now()
    const result = checkRateLimit(uniqueKey(), { windowMs: 60_000, max: 5 })
    expect(result.resetAt).toBeGreaterThan(before)
  })

  it('tracks different keys independently', () => {
    const keyA = uniqueKey()
    const keyB = uniqueKey()
    const opts = { windowMs: 60_000, max: 1 }
    checkRateLimit(keyA, opts)
    checkRateLimit(keyA, opts) // keyA blocked

    const resultB = checkRateLimit(keyB, opts)
    expect(resultB.allowed).toBe(true) // keyB unaffected
  })
})

describe('rateLimitHeaders', () => {
  it('returns correct header keys', () => {
    const result = checkRateLimit(uniqueKey(), { windowMs: 60_000, max: 10 })
    const headers = rateLimitHeaders(result)
    expect(headers).toHaveProperty('X-RateLimit-Remaining')
    expect(headers).toHaveProperty('X-RateLimit-Reset')
  })

  it('remaining header matches result', () => {
    const result = checkRateLimit(uniqueKey(), { windowMs: 60_000, max: 10 })
    const headers = rateLimitHeaders(result)
    expect(headers['X-RateLimit-Remaining']).toBe(String(result.remaining))
  })
})
