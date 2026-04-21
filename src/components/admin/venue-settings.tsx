'use client'

import { useState } from 'react'
import { Settings, Plus, Trash2, Save } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import { updateVenueSettings } from '@/services/venues'
import type { TimeSlot, PaxPackage, Venue } from '@/types'

interface VenueSettingsProps {
  venue: Venue
}

export function VenueSettings({ venue }: VenueSettingsProps) {
  const [slots, setSlots] = useState<TimeSlot[]>(venue.time_slots ?? [])
  const [packages, setPackages] = useState<PaxPackage[]>(venue.pax_packages ?? [])
  const [saving, setSaving] = useState(false)

  function updateSlot(index: number, field: keyof TimeSlot, value: string | number) {
    setSlots((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index))
  }

  function addSlot() {
    setSlots((prev) => [...prev, { label: '', start_time: '08:00', end_time: '12:00', price: 0 }])
  }

  function updatePackage(index: number, field: keyof PaxPackage, value: string | number) {
    setPackages((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function removePackage(index: number) {
    setPackages((prev) => prev.filter((_, i) => i !== index))
  }

  function addPackage() {
    setPackages((prev) => [...prev, { label: '', min_pax: 1, max_pax: 100, price: 0 }])
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateVenueSettings(venue.id, { time_slots: slots, pax_packages: packages })
      toast({ title: 'Venue pricing updated', description: 'Changes apply to all new bookings immediately.' })
    } catch {
      toast({ title: 'Save failed', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-slate-600" />
          <h2 className="text-xl font-bold text-slate-900">Venue Settings</h2>
        </div>
        <p className="text-sm text-slate-500">{venue.name}</p>
      </div>

      {/* Time Slots */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Time Slots</h3>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1fr_90px_90px_100px_40px] gap-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span>Label</span><span>Start</span><span>End</span><span>Price (RM)</span><span />
          </div>
          {slots.map((slot, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_90px_100px_40px] gap-2 items-center rounded-lg bg-slate-50 px-3 py-2">
              <input value={slot.label} onChange={(e) => updateSlot(i, 'label', e.target.value)} placeholder="Label" className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm" />
              <input value={slot.start_time} onChange={(e) => updateSlot(i, 'start_time', e.target.value)} placeholder="08:00" className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm" />
              <input value={slot.end_time} onChange={(e) => updateSlot(i, 'end_time', e.target.value)} placeholder="12:00" className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm" />
              <input type="number" value={slot.price} onChange={(e) => updateSlot(i, 'price', Number(e.target.value))} className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm" />
              <button type="button" onClick={() => removeSlot(i)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addSlot} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors">
            <Plus className="h-4 w-4" /> Add Time Slot
          </button>
        </div>
      </section>

      {/* Guest Packages */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Guest Packages</h3>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_100px_40px] gap-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span>Label</span><span>Min Pax</span><span>Max Pax</span><span>Price (RM)</span><span />
          </div>
          {packages.map((pkg, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_100px_40px] gap-2 items-center rounded-lg bg-slate-50 px-3 py-2">
              <input value={pkg.label} onChange={(e) => updatePackage(i, 'label', e.target.value)} placeholder="Label" className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm" />
              <input type="number" value={pkg.min_pax} onChange={(e) => updatePackage(i, 'min_pax', Number(e.target.value))} className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm" />
              <input type="number" value={pkg.max_pax} onChange={(e) => updatePackage(i, 'max_pax', Number(e.target.value))} className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm" />
              <input type="number" value={pkg.price} onChange={(e) => updatePackage(i, 'price', Number(e.target.value))} className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm" />
              <button type="button" onClick={() => removePackage(i)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addPackage} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors">
            <Plus className="h-4 w-4" /> Add Guest Package
          </button>
        </div>
      </section>

      <div className="flex items-center gap-4 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? 'Saving…' : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
        <p className="text-xs text-slate-400">Changes apply to new bookings immediately. Existing bookings are unaffected.</p>
      </div>
    </div>
  )
}
