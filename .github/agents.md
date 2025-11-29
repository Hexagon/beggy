# Beggy - Agent Instructions

## Project Overview

Beggy is a Swedish secondhand marketplace built with Deno 2.5 and Oak framework.
The platform is designed to be simple and easy to use, similar to the original Blocket.

## Technology Stack

- **Runtime**: Deno 2.5+
- **Web Framework**: Oak
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Deno Deploy (beggy.se)

## Project Structure

```
beggy/
├── main.ts              # Application entry point
├── deno.json            # Deno configuration and dependencies
├── src/
│   ├── routes/          # API and page routes
│   ├── db/              # Supabase client and schema
│   ├── models/          # Type definitions
│   ├── middleware/      # Oak middleware
│   └── utils/           # Utility functions
├── static/              # Static assets (CSS, JS)
└── templates/           # HTML templates
```

## Development Commands

```bash
# Start development server with auto-reload
deno task dev

# Run production server
deno task start

# Run tests
deno task test

# Lint code
deno task lint

# Format code
deno task fmt

# Type check
deno task check
```

## Environment Variables

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Key Features

1. **User Accounts**: Registration and login via Supabase Auth
2. **Ad Management**: Create, edit, delete ads
3. **Image Upload**: Max 5 images per ad (stored in Supabase Storage)
4. **Search & Browse**: Category-based browsing and search

## Legal Compliance

- GDPR compliant (Swedish/EU data protection)
- Clear terms of service in Swedish
- Cookie consent where required
- User data deletion capability

## Database Schema (Supabase/PostgreSQL)

- `profiles`: User profiles linked to auth.users (id, email, name, phone, city)
- `ads`: Advertisements (id, user_id, title, description, price, category, city, status)
- `images`: Ad images (id, ad_id, filename, storage_path)

## Supabase Storage

- Bucket: `ad-images` (public)
- Images are stored with path: `{user_id}/{filename}`

## Code Style

- Use TypeScript
- No semicolons
- Line width: 100 characters
- Use Oak Router for routes
- Use Supabase client for all database operations
