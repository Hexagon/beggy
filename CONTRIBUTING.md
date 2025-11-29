# Contributing to Beggy

Thank you for your interest in contributing to Beggy! This document provides guidelines and
information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/beggy.git`
3. Follow the [Installation Guide](INSTALL.md) to set up your development environment
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Running the Development Server

```bash
deno task dev
```

This starts the server with auto-reload on file changes.

### Code Quality Commands

```bash
# Format code
deno task fmt

# Lint code
deno task lint

# Type check
deno task check

# Run tests
deno task test

# Run all checks (recommended before committing)
deno task precommit
```

### Pre-commit Checklist

Before committing your changes, always run:

```bash
deno task precommit
```

This command runs:

1. `deno task fmt` - Formats all code
2. `deno task lint` - Checks for linting errors
3. `deno task check` - Performs type checking

**All checks must pass before committing.**

## Code Style

### TypeScript

- Use TypeScript for all new code
- No semicolons (configured in `deno.json`)
- Line width: 100 characters
- Use explicit types for function parameters and return values
- Prefer `const` over `let` when possible

### File Organization

```
src/
├── routes/       # API route handlers
├── db/           # Database client and queries
├── models/       # Type definitions
├── middleware/   # Oak middleware
└── utils/        # Utility functions
```

### Naming Conventions

- Files: `kebab-case.ts`
- Functions: `camelCase`
- Types/Interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Database tables: `snake_case`

### Comments

- Write comments in English
- Use JSDoc for public functions
- Explain "why", not "what"

## Testing

### Running Tests

```bash
deno task test
```

### Writing Tests

- Place test files next to the code they test: `feature.ts` → `feature.test.ts`
- Or use a `__tests__` directory
- Use Deno's built-in test runner
- Name tests descriptively

Example:

```typescript
import { assertEquals } from "jsr:@std/assert"

Deno.test("formatPrice formats Swedish currency correctly", () => {
  assertEquals(formatPrice(1000), "1 000 kr")
})
```

### Test Environment

Tests require environment variables. Set them before running:

```bash
export SUPABASE_URL="your-test-url"
export SUPABASE_ANON_KEY="your-test-key"
deno task test
```

Consider using a separate Supabase project for testing.

## Pull Request Process

### Before Submitting

1. Run `deno task precommit` and fix any issues
2. Update documentation if needed
3. Add tests for new functionality
4. Ensure all tests pass

### PR Guidelines

- Use clear, descriptive titles
- Reference any related issues
- Describe what changes you made and why
- Include screenshots for UI changes
- Keep PRs focused - one feature/fix per PR

### PR Title Format

- `feat: Add new feature`
- `fix: Fix bug description`
- `docs: Update documentation`
- `refactor: Refactor code`
- `test: Add tests`
- `chore: Update dependencies`

## Project Structure

### Key Files

| File                  | Purpose                      |
| --------------------- | ---------------------------- |
| `main.ts`             | Application entry point      |
| `deno.json`           | Deno configuration and tasks |
| `src/routes/mod.ts`   | Route aggregation            |
| `src/db/database.ts`  | Supabase client and schema   |
| `src/models/types.ts` | TypeScript type definitions  |

### Adding New Features

1. **API Routes**: Add to `src/routes/` and register in `mod.ts`
2. **Database**: Update schema in `src/db/database.ts` comments
3. **Types**: Add to `src/models/types.ts`
4. **Frontend**: Update templates in `templates/` and static files in `static/`

## Swedish Language

Beggy is a Swedish marketplace, so:

- User-facing text should be in Swedish
- Code comments and documentation in English
- Variable names in English

## Legal Considerations

### GDPR Compliance

When adding features that handle user data:

- Ensure data can be deleted (right to be forgotten)
- Don't collect unnecessary data
- Update privacy policy if needed

### Terms of Service

If adding new functionality that affects user agreements, update `/villkor` page.

## Getting Help

- Check existing issues and PRs
- Open an issue for bugs or feature requests
- Ask questions in issue comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
