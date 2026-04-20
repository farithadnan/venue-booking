import Link from 'next/link'
import { CheckCircle, ArrowLeft, Calendar, Clock, MapPin, User, Mail, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import { formatDate, formatTime } from '@/lib/utils'
import type { Booking } from '@/types'

export function BookingConfirmation({ booking }: { booking: Booking }) {
  const { status } = booking

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <StatusBanner status={status} />

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Booking Details</CardTitle>
            <StatusBadge status={status} />
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Reference Number</p>
              <p className="font-mono text-lg font-bold text-slate-900 mt-0.5">{booking.reference_number}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow icon={User} label="Guest Name" value={booking.user_name} />
              <DetailRow icon={Mail} label="Email" value={booking.user_email} />
              <DetailRow icon={Calendar} label="Event Date" value={formatDate(booking.date)} />
              <DetailRow
                icon={Clock}
                label="Time Slot"
                value={`${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`}
              />
              <DetailRow
                icon={MapPin}
                label="Venue"
                value={booking.venue?.name ?? 'The Grand Hall at Majestic Place'}
              />
              <DetailRow label="Event Name" value={booking.event_name} />
            </div>

            {booking.notes && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-slate-700">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center h-10 px-5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/booking"
            className="flex-1 inline-flex items-center justify-center h-10 px-5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
          >
            Book Another Event
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Save your reference number:{' '}
          <span className="font-mono font-semibold">{booking.reference_number}</span>. Use it to
          look up your booking status at any time.
        </p>
      </div>
    </div>
  )
}

function StatusBanner({ status }: { status: Booking['status'] }) {
  const config = {
    pending: {
      bg: 'bg-amber-50 border-amber-200',
      icon: <CheckCircle className="mx-auto h-12 w-12 mb-3 text-amber-500" />,
      title: 'Booking Request Received!',
      body: 'Your request has been submitted. You will receive an email once it is reviewed.',
    },
    approved: {
      bg: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="mx-auto h-12 w-12 mb-3 text-green-500" />,
      title: 'Booking Confirmed!',
      body: 'Your booking has been approved. We look forward to hosting your event!',
    },
    rejected: {
      bg: 'bg-red-50 border-red-200',
      icon: <XCircle className="mx-auto h-12 w-12 mb-3 text-red-400" />,
      title: 'Booking Not Approved',
      body: 'Unfortunately your booking request was not approved. Please contact us for more information.',
    },
  }

  const { bg, icon, title, body } = config[status]

  return (
    <div className={`rounded-xl border p-6 text-center ${bg}`}>
      {icon}
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
      <p className="text-slate-600 text-sm">{body}</p>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}
