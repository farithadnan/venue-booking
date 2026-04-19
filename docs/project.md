# Project Specification — Venue Booking Web App

## Project Details

- **Title:** Build a Hall / Venue Booking Web App
- **Deadline:** Sunday, 26 April 2026, 1:00 PM MYT
- **Tags:** react · nextjs · frontend · fullstack · uiux · responsive-design · booking-system · dashboard · forms · supabase

## Requirements

| # | Requirement                                        | Status   |
|---|----------------------------------------------------|----------|
| 1 | Responsive landing page for the venue              | ⬜ Todo  |
| 2 | Venue details page with key information            | ⬜ Todo  |
| 3 | Booking request form                               | ⬜ Todo  |
| 4 | Date and time slot selection                       | ⬜ Todo  |
| 5 | Booking confirmation page                          | ⬜ Todo  |
| 6 | Admin login page                                   | ⬜ Todo  |
| 7 | Admin dashboard to manage bookings                 | ⬜ Todo  |
| 8 | Booking statuses: pending, approved, rejected      | ⬜ Todo  |
| 9 | Proper form validation                             | ⬜ Todo  |
| 10| Clean and user-friendly experience                 | ⬜ Todo  |

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 14 (App Router)             |
| Language    | TypeScript                          |
| Styling     | Tailwind CSS                        |
| Database    | Supabase (PostgreSQL)               |
| Auth        | Supabase Auth                       |
| Forms       | React Hook Form + Zod               |
| Icons       | Lucide React                        |
| Date Picker | React Day Picker                    |
| Testing     | Jest + React Testing Library        |

## Venue Details (Mock Data)

**Venue:** The Grand Hall at Majestic Place  
**Capacity:** Up to 500 guests  
**Location:** Kuala Lumpur City Centre  
**Price:** Starting from RM 2,000 / session

**Amenities:**
- Built-in stage and PA system
- Air-conditioned hall
- Catering kitchen access
- Ample parking (200+ spots)
- Dedicated bridal suite
- AV equipment (projector, screens)
- WiFi throughout venue
- Security personnel

**Time Slots:**
| Slot        | Time               | Price    |
|-------------|-------------------|----------|
| Morning     | 8:00 AM – 12:00 PM | RM 2,000 |
| Afternoon   | 1:00 PM – 5:00 PM  | RM 2,000 |
| Evening     | 6:00 PM – 11:00 PM | RM 2,500 |
| Full Day    | 8:00 AM – 11:00 PM | RM 5,500 |

## User Stories

### Guest
- As a guest, I want to see venue photos and information so I can decide if it suits my event.
- As a guest, I want to check available time slots for a specific date.
- As a guest, I want to submit a booking request with my details.
- As a guest, I want to receive a confirmation with a reference number after submitting.

### Admin
- As an admin, I want to log in securely to access the dashboard.
- As an admin, I want to see all incoming booking requests.
- As an admin, I want to approve or reject bookings.
- As an admin, I want to filter bookings by status.
- As an admin, I want to search bookings by guest name or date.

## Non-Requirements

- No payment integration
- No real-time calendar sync
- No email notifications (can be added as future enhancement)
