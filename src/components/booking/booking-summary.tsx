'use client'

import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import type { TimeSlot, PaxPackage } from '@/types'

interface BookingSummaryProps {
  date: Date | undefined
  slot: TimeSlot | null
  paxPackage: PaxPackage | null
}

export function BookingSummary({ date, slot, paxPackage }: BookingSummaryProps) {
  const total = slot && paxPackage ? slot.price + paxPackage.price : null

  return (
    <div className="bg-white border-2 border-amber-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Booking Summary</p>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Date</span>
          <span className="font-medium text-slate-900">
            {date ? format(date, 'dd MMM yyyy') : <span className="text-slate-300">—</span>}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Time Slot</span>
          <div className="text-right">
            {slot ? (
              <>
                <div className="font-medium text-slate-900">{slot.label}</div>
                <div className="text-xs text-slate-400">{slot.start_time} – {slot.end_time}</div>
              </>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Guests</span>
          <div className="text-right">
            {paxPackage ? (
              <>
                <div className="font-medium text-slate-900">{paxPackage.label}</div>
                <div className="text-xs text-slate-400">{paxPackage.min_pax} – {paxPackage.max_pax} pax</div>
              </>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>
        </div>
      </div>

      {(slot || paxPackage) && (
        <>
          <div className="border-t border-dashed border-amber-200 pt-3 space-y-1.5 text-sm">
            {slot && (
              <div className="flex justify-between">
                <span className="text-slate-500">Time Slot</span>
                <span className="text-slate-900">{formatCurrency(slot.price)}</span>
              </div>
            )}
            {paxPackage && (
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Package</span>
                <span className="text-slate-900">{formatCurrency(paxPackage.price)}</span>
              </div>
            )}
          </div>

          {total !== null && (
            <div className="border-t border-amber-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-amber-600">{formatCurrency(total)}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
