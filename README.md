# Venue Booking Web App

A responsive hall and venue booking system built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- Browse venue details, capacity, and amenities
- Select a date and time slot for your event
- Submit a booking request with full form validation
- Receive a booking confirmation with reference number
- Admin dashboard to manage and update booking statuses (pending / approved / rejected)

## Tech Stack

- **Framework** — Next.js 14 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS
- **Database & Auth** — Supabase
- **Forms** — React Hook Form + Zod
- **Testing** — Jest + React Testing Library

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy the env template and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |

## Running Tests

```bash
npm test
```

## License

Copyright (c) 2026 Farith Adnan. All rights reserved. See [LICENSE](./LICENSE) for details.
