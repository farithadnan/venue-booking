'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBookingSchema, type CreateBookingInput } from '@/lib/validations'
import { TIME_SLOTS_FALLBACK } from '@/lib/constants'
import type { TimeSlot } from '@/types'
import { useCreateBooking } from '@/hooks/useCreateBooking'
import { toast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { DatePicker } from './date-picker'
import { SlotPicker } from './slot-picker'

interface BookingFormProps {
  venueId: string
}

export function BookingForm({ venueId }: BookingFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { submit, loading } = useCreateBooking()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: { venue_id: venueId },
  })

  useEffect(() => {
    const slotParam = searchParams.get('slot')
    if (slotParam) {
      const match = TIME_SLOTS_FALLBACK.find(
        (s) => s.label.toLowerCase().replace(' ', '-') === slotParam
      )
      if (match) {
        setSelectedSlot(match)
        setValue('start_time', match.start_time)
        setValue('end_time', match.end_time)
      }
    }
  }, [searchParams, setValue])

  function handleDateChange(date: Date | undefined) {
    setSelectedDate(date)
    if (date) setValue('date', format(date, 'yyyy-MM-dd'))
  }

  function handleSlotChange(slot: TimeSlot) {
    setSelectedSlot(slot)
    setValue('start_time', slot.start_time)
    setValue('end_time', slot.end_time)
  }

  async function onSubmit(data: CreateBookingInput) {
    const result = await submit(data)
    if (result) {
      router.push(`/booking/confirmation?id=${result.id}`)
    } else {
      toast({ title: 'Booking failed', description: 'Please check your details and try again.', variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <input type="hidden" {...register('venue_id')} />

      {/* Guest info */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Your Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="user_name">Full Name *</Label>
            <Input
              id="user_name"
              placeholder="Ahmad Razif"
              error={errors.user_name?.message}
              {...register('user_name')}
            />
            {errors.user_name && (
              <p className="text-xs text-red-500">{errors.user_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user_email">Email Address *</Label>
            <Input
              id="user_email"
              type="email"
              placeholder="you@example.com"
              error={errors.user_email?.message}
              {...register('user_email')}
            />
            {errors.user_email && (
              <p className="text-xs text-red-500">{errors.user_email.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="event_name">Event Name *</Label>
          <Input
            id="event_name"
            placeholder="e.g. Wedding Reception, Annual Dinner"
            error={errors.event_name?.message}
            {...register('event_name')}
          />
          {errors.event_name && (
            <p className="text-xs text-red-500">{errors.event_name.message}</p>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Date & Time</h3>
        <div className="space-y-1.5">
          <Label>Event Date *</Label>
          <input type="hidden" {...register('date')} />
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            error={errors.date?.message}
          />
          {errors.date && (
            <p className="text-xs text-red-500">{errors.date.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Time Slot *</Label>
          <input type="hidden" {...register('start_time')} />
          <input type="hidden" {...register('end_time')} />
          <SlotPicker
            value={selectedSlot}
            onChange={handleSlotChange}
            error={errors.start_time?.message}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          placeholder="Special requirements, dietary needs, setup preferences..."
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-xs text-red-500">{errors.notes.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Spinner size="sm" />
            Submitting Booking...
          </>
        ) : (
          'Submit Booking Request'
        )}
      </Button>

      <p className="text-center text-xs text-slate-500">
        Your booking will be reviewed within 24 hours. You will receive a confirmation email once approved.
      </p>
    </form>
  )
}
