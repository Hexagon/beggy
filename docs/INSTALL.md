# Installation Guide

This guide will help you set up Beggy for local development or production deployment.

## Prerequisites

- [Deno](https://deno.land/) 2.5 or later
- A [Supabase](https://supabase.com/) account (free tier works)

## 1. Clone the Repository

```bash
git clone https://github.com/Hexagon/beggy.git
cd beggy
```

## 2. Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### Get API Credentials

1. Go to **Project Settings** > **API**
2. Copy the **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy the **anon/public** key
4. Copy the **service_role** key (required for account deletion to work properly)

### Create Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the SQL schema from `src/db/database.ts` (the commented section)
3. Run the SQL to create all tables, indexes, policies, and triggers

### Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `ad-images`
3. Set the bucket to **Public** (for image URLs to work)
4. Add a policy allowing authenticated users to upload:
   - Go to **Policies** for the bucket
   - Create a policy for INSERT: `auth.role() = 'authenticated'`
   - Create a policy for SELECT: `true` (public read)
   - Create a policy for DELETE: `auth.uid()::text = (storage.foldername(name))[1]`

## 3. Environment Variables

### Setup Using .env File (Recommended for Local Development)

Beggy uses environment variables for configuration. The easiest way to set these up locally is:

1. **Copy the template file:**

```bash
cp .env.template .env
```

2. **Edit the `.env` file** and fill in your actual values:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# Server Configuration
PORT=8000

# Message Encryption
ENCRYPTION_SECRET=generate-a-random-secret-key-here
```

3. **Generate a secure encryption secret:**

```bash
# Generate a random secret (use one of these methods)
openssl rand -base64 32
# or
deno eval "console.log(crypto.randomUUID() + crypto.randomUUID())"
```

The `.env` file is automatically loaded when you start the application - no need to manually export
variables!

### Required Variables

| Variable                    | Description                                    | Example                     |
| --------------------------- | ---------------------------------------------- | --------------------------- |
| `SUPABASE_URL`              | Your Supabase project URL                      | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY`         | Your Supabase anonymous key                    | `eyJhbGciOiJIUzI1NiIs...`   |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (for deletions) | `eyJhbGciOiJIUzI1NiIs...`   |
| `ENCRYPTION_SECRET`         | Secret key for message encryption              | Random 32+ character string |

**Security Note:** The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security and should be kept
secure. It's required for the account deletion feature to work properly (deleting both profile and
auth user). Without it, only the profile will be deleted when a user deletes their account, leaving
the auth.users record intact.

### Optional Variables

| Variable | Description                          | Default |
| -------- | ------------------------------------ | ------- |
| `PORT`   | Server port                          | `8000`  |
| `DEV`    | Enable development mode (no caching) | `false` |

### Alternative Methods

#### Option 1: Export in Terminal (Temporary)

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export ENCRYPTION_SECRET="your-secret-key"
```

#### Option 2: Deno Deploy (Production)

Set environment variables in the Deno Deploy dashboard under **Settings** > **Environment
Variables**.

## 4. Run the Application

### Development Mode (with auto-reload)

```bash
deno task dev
```

### Production Mode

```bash
deno task start
```

The application will be available at `http://localhost:8000`

## 5. Verify Installation

1. Open `http://localhost:8000` in your browser
2. You should see the Beggy homepage
3. Try registering a new account
4. Create a test ad to verify database connection
5. Upload an image to verify storage connection

## Troubleshooting

### "Missing SUPABASE_URL or SUPABASE_ANON_KEY"

Make sure environment variables are set correctly. Verify with:

```bash
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

### Database Errors

1. Verify the SQL schema was run successfully in Supabase
2. Check Row Level Security policies are created
3. Verify the `handle_new_user` trigger exists

### Image Upload Errors

1. Verify the `ad-images` bucket exists in Supabase Storage
2. Check the bucket is set to public
3. Verify storage policies allow authenticated uploads

### Port Already in Use

Change the port:

```bash
PORT=3000 deno task dev
```

## Production Deployment

### Deno Deploy

1. Connect your GitHub repository to [Deno Deploy](https://deno.com/deploy)
2. Set the entry point to `main.ts`
3. Add environment variables in the dashboard
4. Configure custom domain (e.g., `beggy.se`)

### Docker (Alternative)

```dockerfile
FROM denoland/deno:2.5.0

WORKDIR /app
COPY . .

RUN deno cache main.ts

EXPOSE 8000

CMD ["deno", "task", "start"]
```

## Next Steps

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Check [README.md](../README.md) for project overview
- See [docs/agents.md](agents.md) for AI agent instructions
- See [docs/legal.md](legal.md) for legal requirements (BBS law, GDPR)
