'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Booking, PaginatedResponse } from '@/types'
import { fetchBookings, type FetchBookingsParams } from '@/services/bookings'

interface State {
  data: PaginatedResponse<Booking> | null
  loading: boolean
  error: string | null
}

export function useBookings(params: FetchBookingsParams = {}) {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetchBookings(params)
      setState({ data, loading: false, error: null })
    } catch {
      setState({ data: null, loading: false, error: 'Failed to load bookings.' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.status, params.page, params.limit])

  useEffect(() => { load() }, [load])

  return { ...state, reload: load }
}
