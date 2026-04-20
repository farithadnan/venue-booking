'use client'

import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  error?: string
}

const today = new Date()
today.setHours(0, 0, 0, 0)

export function DatePicker({ value, onChange, error }: DatePickerProps) {
  return (
    <div>
      <div
        className={cn(
          'rounded-xl border bg-white p-3',
          error ? 'border-red-400' : 'border-slate-200'
        )}
      >
        <DayPicker
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={[{ before: today }]}
          classNames={{
            root: 'w-full',
            months: 'flex flex-col',
            month: 'w-full',
            month_caption: 'flex items-center justify-between px-2 pb-3',
            caption_label: 'text-sm font-semibold text-slate-900',
            nav: 'flex items-center gap-1',
            button_previous: 'h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors',
            button_next: 'h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors',
            month_grid: 'w-full border-collapse',
            weekdays: 'flex mb-1',
            weekday: 'flex-1 text-center text-xs font-medium text-slate-400 py-1',
            week: 'flex',
            day: 'flex-1 h-9 p-0',
            day_button: cn(
              'h-9 w-full rounded-lg text-sm font-medium transition-colors',
              'hover:bg-amber-50 hover:text-amber-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500'
            ),
            selected: '[&>button]:bg-amber-600 [&>button]:text-white [&>button]:hover:bg-amber-700 [&>button]:hover:text-white',
            today: '[&>button]:font-bold [&>button]:text-amber-600',
            disabled: '[&>button]:text-slate-300 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent [&>button]:hover:text-slate-300',
            outside: '[&>button]:text-slate-300',
          }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
