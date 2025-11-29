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
├── docs/
│   ├── INSTALL.md       # Installation and setup guide
│   ├── CONTRIBUTING.md  # Contribution guidelines
│   ├── legal.md         # Legal requirements (BBS law, GDPR)
│   └── agents.md        # This file - AI agent instructions
├── src/
│   ├── routes/          # API and page routes
│   ├── db/              # Supabase client and schema
│   │   └── migrations/  # Database migration SQL files
│   ├── models/          # Type definitions
│   ├── middleware/      # Oak middleware
│   └── utils/           # Utility functions
├── static/              # Static assets (CSS, JS)
└── templates/           # HTML templates
```

## Legal Compliance (IMPORTANT)

**Read [docs/legal.md](legal.md) before making changes that involve:**

- User data handling
- Ad content moderation
- Cookies or tracking
- Privacy or data protection

Key legal requirements:

1. **BBS-lagen (Swedish BBS Law)**: Report function required on all ads
2. **GDPR**: Users must be able to export and delete all their data
3. **Cookie Law**: Only essential cookies (authentication) are used

See [docs/legal.md](legal.md) for full details.

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
5. **Report Ads**: BBS law compliance - users can report inappropriate ads
6. **Data Export**: GDPR compliance - users can export all their data
7. **Logged-out Browsing**: Site is fully usable without login (browse, search, view ads)

## Database Schema (Supabase/PostgreSQL)

Tables:

- `profiles`: User profiles linked to auth.users (id, email, name, phone, city)
- `ads`: Advertisements (id, user_id, title, description, price, category, city, status)
- `images`: Ad images (id, ad_id, filename, storage_path)

### Database Migrations

Database schema files are located in `src/db/migrations/`:

- `001_initial_schema.sql` - The original schema that created the production database

**IMPORTANT: Database Change Policy**

1. **DO NOT modify `001_initial_schema.sql`** - This file represents the initial production database
   state and must remain unchanged for historical reference
2. **Create new migration files** for any database changes using sequential numbering:
   - `002_add_new_feature.sql`
   - `003_update_existing_table.sql`
   - etc.
3. Each migration file should:
   - Have a clear descriptive name
   - Include a comment header explaining the purpose
   - Be idempotent when possible (use `IF NOT EXISTS`, `IF EXISTS`, etc.)
   - Be applied in order to the production database via Supabase SQL Editor

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
- `GET /api/auth/my-data` - Export user data (GDPR Article 20)
- `DELETE /api/auth/account` - Delete account (GDPR Article 17)

### Ads

- `GET /api/ads` - List ads (with pagination and filters) - **public, no auth required**
- `GET /api/ads/:id` - Get single ad - **public, no auth required**
- `POST /api/ads` - Create ad - requires auth
- `PUT /api/ads/:id` - Update ad - requires auth, owner only
- `DELETE /api/ads/:id` - Delete ad - requires auth, owner only
- `POST /api/ads/:id/images` - Upload images (max 5) - requires auth, owner only
- `DELETE /api/images/:id` - Delete image - requires auth, owner only
- `POST /api/ads/:id/report` - Report ad (BBS law) - **public, no auth required**

### Other

- `GET /api/categories` - List categories - **public**
- `GET /api/my-ads` - Get user's ads - requires auth

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
