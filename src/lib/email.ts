import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import type { Booking } from '@/types'

const FROM = env.RESEND_FROM_EMAIL ?? 'Venue Booking <noreply@venuebooking.app>'
const APP_URL = env.APP_URL ?? 'http://localhost:3000'

interface SendOptions {
  to: string
  subject: string
  html: string
}

async function send({ to, subject, html }: SendOptions): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.warn('Email skipped: RESEND_API_KEY not configured', { to, subject })
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}

export async function sendBookingConfirmation(booking: Booking & { venue_name: string }): Promise<void> {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1a1a1a">Booking Request Received</h2>
      <p>Hi ${escHtml(booking.user_name)}, your booking request has been received and is pending review.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        <tr><td style="padding:8px 0;color:#666;width:160px">Reference</td><td style="padding:8px 0;font-weight:600">${escHtml(booking.reference_number)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Venue</td><td style="padding:8px 0">${escHtml(booking.venue_name)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Event</td><td style="padding:8px 0">${escHtml(booking.event_name)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Date</td><td style="padding:8px 0">${escHtml(booking.date)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Time</td><td style="padding:8px 0">${escHtml(booking.start_time)} – ${escHtml(booking.end_time)}</td></tr>
      </table>
      <p style="color:#666;font-size:14px">You'll receive another email once your booking is reviewed.</p>
      <a href="${APP_URL}/booking/${booking.reference_number}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:6px">View Booking</a>
    </div>
  `

  await send({
    to: booking.user_email,
    subject: `Booking Request Received — ${booking.reference_number}`,
    html,
  })
}

export async function sendBookingStatusUpdate(
  booking: Booking & { venue_name: string }
): Promise<void> {
  const approved = booking.status === 'approved'
  const statusLabel = approved ? 'Approved' : 'Rejected'
  const color = approved ? '#16a34a' : '#dc2626'

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:${color}">Booking ${statusLabel}</h2>
      <p>Hi ${escHtml(booking.user_name)}, your booking request has been <strong>${statusLabel.toLowerCase()}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        <tr><td style="padding:8px 0;color:#666;width:160px">Reference</td><td style="padding:8px 0;font-weight:600">${escHtml(booking.reference_number)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Venue</td><td style="padding:8px 0">${escHtml(booking.venue_name)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Event</td><td style="padding:8px 0">${escHtml(booking.event_name)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Date</td><td style="padding:8px 0">${escHtml(booking.date)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Time</td><td style="padding:8px 0">${escHtml(booking.start_time)} – ${escHtml(booking.end_time)}</td></tr>
      </table>
      ${approved ? `<a href="${APP_URL}/booking/${booking.reference_number}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">View Confirmation</a>` : ''}
    </div>
  `

  await send({
    to: booking.user_email,
    subject: `Booking ${statusLabel} — ${booking.reference_number}`,
    html,
  })
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
