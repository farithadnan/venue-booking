'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { formatTime } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import { BookingActions } from './booking-actions'
import type { Booking } from '@/types'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

interface BookingsTableProps {
  bookings: Booking[]
  loading: boolean
  error: string | null
  pagination?: {
    page: number
    totalPages: number
    total: number
  }
  onPageChange?: (page: number) => void
  onBookingUpdated: () => void
}

export function BookingsTable({
  bookings,
  loading,
  error,
  pagination,
  onPageChange,
  onBookingUpdated,
}: BookingsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <Inbox className="mx-auto h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-500">No bookings found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Desktop table */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{booking.user_name}</div>
                  <div className="text-xs text-slate-500">{booking.user_email}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{booking.event_name}</td>
                <td className="px-4 py-3 text-slate-700">
                  {format(new Date(booking.date + 'T00:00:00'), 'dd MMM yyyy')}
                </td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {booking.reference_number}
                </td>
                <td className="px-4 py-3">
                  <BookingActions booking={booking} onUpdated={onBookingUpdated} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-900">{booking.user_name}</div>
                <div className="text-xs text-slate-500">{booking.user_email}</div>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            <div className="text-sm text-slate-700">{booking.event_name}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{format(new Date(booking.date + 'T00:00:00'), 'dd MMM yyyy')}</span>
              <span>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</span>
              <span className="font-mono">{booking.reference_number}</span>
            </div>
            {booking.notes && (
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                className="text-xs text-amber-600 hover:underline"
              >
                {expandedId === booking.id ? 'Hide notes' : 'Show notes'}
              </button>
            )}
            {expandedId === booking.id && booking.notes && (
              <p className="text-xs text-slate-600 bg-slate-50 rounded p-2">{booking.notes}</p>
            )}
            <BookingActions booking={booking} onUpdated={onBookingUpdated} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">{pagination.total} total bookings</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-700">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
