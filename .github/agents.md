# Beggy - Agent Instructions

## Project Overview

Beggy is a Swedish secondhand marketplace built with Deno 2.5 and Oak framework. The platform is
designed to be simple and easy to use, similar to the original Blocket.

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
├── INSTALL.md           # Installation and setup guide
├── CONTRIBUTING.md      # Contribution guidelines
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

# Pre-commit (format + lint + check) - RUN BEFORE EVERY COMMIT
deno task precommit
```

## Pre-commit Workflow

**IMPORTANT**: Always run `deno task precommit` before committing changes.

This command runs:

1. `deno fmt` - Auto-formats all TypeScript files
2. `deno lint` - Checks for linting errors
3. `deno check main.ts` - Performs type checking

All checks must pass before committing. If any check fails, fix the issues and run again.

## Environment Variables

Required environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

Optional:

- `PORT`: Server port (default: 8000)

## Testing

### Running Tests

```bash
deno task test
```

### Test Requirements

- Tests require `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
- Use a separate Supabase project for testing to avoid affecting production data
- Tests run with permissions: `--allow-net --allow-read --allow-write --allow-env`

### Writing Tests

- Place test files next to source files: `feature.ts` → `feature.test.ts`
- Or use `__tests__/` directories
- Use Deno's built-in test runner and assertions

Example test:

```typescript
import { assertEquals } from "jsr:@std/assert"

Deno.test("example test", () => {
  assertEquals(1 + 1, 2)
})
```

### Test Categories

- **Unit tests**: Test individual functions
- **Integration tests**: Test API endpoints
- **E2E tests**: Test full user flows

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

Tables:

- `profiles`: User profiles linked to auth.users (id, email, name, phone, city)
- `ads`: Advertisements (id, user_id, title, description, price, category, city, status)
- `images`: Ad images (id, ad_id, filename, storage_path)

Full schema SQL is in `src/db/database.ts` comments.

## Supabase Storage

- Bucket: `ad-images` (public)
- Images are stored with path: `{user_id}/{filename}`

## Code Style

- Use TypeScript
- No semicolons (configured in `deno.json`)
- Line width: 100 characters
- Use Oak Router for routes
- Use Supabase client for all database operations

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `DELETE /api/auth/account` - Delete account (GDPR)

### Ads

- `GET /api/ads` - List ads (with pagination and filters)
- `GET /api/ads/:id` - Get single ad
- `POST /api/ads` - Create ad
- `PUT /api/ads/:id` - Update ad
- `DELETE /api/ads/:id` - Delete ad
- `POST /api/ads/:id/images` - Upload images (max 5)
- `DELETE /api/images/:id` - Delete image

### Other

- `GET /api/categories` - List categories
- `GET /api/my-ads` - Get user's ads

## Troubleshooting

### Common Issues

1. **"Supabase not initialized"**: Environment variables not set
2. **Lint errors**: Run `deno task fmt` first, then `deno task lint`
3. **Type errors**: Check imports and type definitions in `src/models/types.ts`
4. **Test failures**: Ensure test Supabase project has correct schema

### Quick Fixes

```bash
# Fix formatting issues
deno task fmt

# Clear Deno cache if having import issues
deno cache --reload main.ts
```
