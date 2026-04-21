'use client'

import { cn, formatCurrency } from '@/lib/utils'
import type { PaxPackage } from '@/types'

interface PaxPickerProps {
  packages: PaxPackage[]
  value: PaxPackage | null
  onChange: (pkg: PaxPackage) => void
  error?: string
}

export function PaxPicker({ packages, value, onChange, error }: PaxPickerProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        {packages.map((pkg) => {
          const selected = value?.label === pkg.label
          return (
            <button
              key={pkg.label}
              type="button"
              onClick={() => onChange(pkg)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                selected
                  ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <span className="font-semibold">{pkg.label}</span>
              <span className="text-xs text-slate-500">
                {pkg.min_pax} – {pkg.max_pax} guests
              </span>
              <span className={cn('mt-1 text-sm font-bold', selected ? 'text-amber-700' : 'text-slate-900')}>
                + {formatCurrency(pkg.price)}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
