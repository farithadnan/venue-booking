'use client'

import { useState } from 'react'
import type { Booking } from '@/types'
import { updateBookingStatus } from '@/services/bookings'
import { ApiError } from '@/services/api'

interface State {
  loading: boolean
  error: string | null
}

export function useUpdateBookingStatus() {
  const [state, setState] = useState<State>({ loading: false, error: null })

  async function update(id: string, status: 'approved' | 'rejected'): Promise<Booking | null> {
    setState({ loading: true, error: null })
    try {
      const booking = await updateBookingStatus(id, { status })
      setState({ loading: false, error: null })
      return booking
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update booking status.'
      setState({ loading: false, error: message })
      return null
    }
  }

  return { ...state, update }
}
