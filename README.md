# Venue Booking Web App

A responsive hall and venue booking system built with Next.js 16, TypeScript, Tailwind CSS, and Supabase.

For full project documentation — architecture, API reference, database schema, environment variables, and design decisions — see [docs/project.md](./docs/project.md).

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npm run dev                  # http://localhost:3000
```

Apply database migrations in the Supabase dashboard SQL Editor (in order):

```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_booking_history.sql
supabase/migrations/004_atomic_booking.sql
supabase/migrations/005_pricing.sql
supabase/migrations/006_atomic_booking_v2.sql
```

## Running Tests

```bash
npm test
```

## License

Copyright (c) 2026 Farith Adnan. All rights reserved. See [LICENSE](./LICENSE) for details.
