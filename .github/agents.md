# Beggy - Agent Instructions

## Project Overview

Beggy is a Swedish secondhand marketplace built with Deno 2.5 and Oak framework.
The platform is designed to be simple and easy to use, similar to the original Blocket.

## Technology Stack

- **Runtime**: Deno 2.5+
- **Web Framework**: Oak
- **Database**: SQLite
- **Deployment**: Deno Deploy (beggy.se)

## Project Structure

```
beggy/
├── main.ts              # Application entry point
├── deno.json            # Deno configuration and dependencies
├── src/
│   ├── routes/          # API and page routes
│   ├── db/              # Database initialization and queries
│   ├── models/          # Type definitions
│   ├── middleware/      # Oak middleware
│   └── utils/           # Utility functions
├── static/              # Static assets (CSS, JS, images)
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

## Key Features

1. **User Accounts**: Simple registration and login
2. **Ad Management**: Create, edit, delete ads
3. **Image Upload**: Max 5 images per ad
4. **Search & Browse**: Category-based browsing and search

## Legal Compliance

- GDPR compliant (Swedish/EU data protection)
- Clear terms of service in Swedish
- Cookie consent where required
- User data deletion capability

## Database Schema

- `users`: User accounts (email, hashed password, contact info)
- `ads`: Advertisements (title, description, price, category, user_id)
- `images`: Ad images (ad_id, filename, path)

## Code Style

- Use TypeScript
- No semicolons
- Line width: 100 characters
- Use Oak Router for routes
- Use prepared statements for SQLite
