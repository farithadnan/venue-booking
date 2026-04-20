'use client'

import { useState } from 'react'
import type { Booking } from '@/types'
import type { CreateBookingInput } from '@/lib/validations'
import { createBooking } from '@/services/bookings'
import { ApiError } from '@/services/api'

interface State {
  data: Booking | null
  loading: boolean
  error: string | null
}

export function useCreateBooking() {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null })

  async function submit(input: CreateBookingInput): Promise<Booking | null> {
    setState({ data: null, loading: true, error: null })
    try {
      const booking = await createBooking(input)
      setState({ data: booking, loading: false, error: null })
      return booking
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      setState({ data: null, loading: false, error: message })
      return null
    }
  }

  return { ...state, submit }
}
