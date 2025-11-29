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

### Required Variables

| Variable            | Description                 | Example                     |
| ------------------- | --------------------------- | --------------------------- |
| `SUPABASE_URL`      | Your Supabase project URL   | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...`   |

### Optional Variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `PORT`   | Server port | `8000`  |

### Setting Environment Variables

#### Option 1: Export in Terminal

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

#### Option 2: Create .env File

Create a `.env` file in the project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Then load it before running:

```bash
export $(cat .env | xargs)
deno task dev
```

#### Option 3: Deno Deploy (Production)

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
- Check [README.md](README.md) for project overview
- See `.github/agents.md` for AI agent instructions
