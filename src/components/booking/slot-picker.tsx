'use client'

import { cn, formatCurrency } from '@/lib/utils'
import { TIME_SLOTS_FALLBACK } from '@/lib/constants'
import type { TimeSlot } from '@/types'

interface SlotPickerProps {
  value: TimeSlot | null
  onChange: (slot: TimeSlot) => void
  error?: string
}

export function SlotPicker({ value, onChange, error }: SlotPickerProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        {TIME_SLOTS_FALLBACK.map((slot) => {
          const selected = value?.label === slot.label
          return (
            <button
              key={slot.label}
              type="button"
              onClick={() => onChange(slot)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                selected
                  ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <span className="font-semibold">{slot.label}</span>
              <span className="text-xs text-slate-500">
                {slot.start_time} – {slot.end_time}
              </span>
              <span className={cn('mt-1 text-sm font-bold', selected ? 'text-amber-700' : 'text-slate-900')}>
                {formatCurrency(slot.price)}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
