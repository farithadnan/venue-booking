import { z } from 'zod'

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export const createBookingSchema = z
  .object({
    venue_id: z.uuid(),
    user_name: z.string().min(2).max(100),
    user_email: z.email(),
    event_name: z.string().min(2).max(200),
    date: z.iso.date().refine(
      (d) => d >= new Date().toISOString().slice(0, 10),
      { message: 'Booking date must not be in the past' }
    ),
    start_time: z.string().regex(TIME_REGEX, 'Invalid time format (HH:MM)'),
    end_time: z.string().regex(TIME_REGEX, 'Invalid time format (HH:MM)'),
    notes: z.string().max(1000).optional(),
  })
  .refine((d) => d.start_time < d.end_time, {
    message: 'end_time must be after start_time',
    path: ['end_time'],
  })

export type CreateBookingInput = z.infer<typeof createBookingSchema>

export const updateBookingStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>

export const BOOKING_STATUSES = ['pending', 'approved', 'rejected'] as const
export type BookingStatusFilter = (typeof BOOKING_STATUSES)[number]

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})
