import { createClient, SupabaseClient } from "@supabase/supabase-js"

let supabase: SupabaseClient | null = null
let supabaseUrl: string | null = null
let supabaseKey: string | null = null
let supabaseServiceRoleKey: string | null = null

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase not initialized")
  }
  return supabase
}

export function getAuthenticatedSupabase(accessToken: string): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase not initialized")
  }
  if (!accessToken) {
    throw new Error("Access token is required")
  }
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export function getAdminSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase admin not initialized - service role key required")
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function initDatabase(
  _supabaseUrl: string | null = null,
  _supabaseKey: string | null = null,
  _supabaseServiceRoleKey: string | null = null,
): void {
  if (!_supabaseUrl || !_supabaseKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. " +
        "Please set them in your environment or .env file.",
    )
  } else {
    supabaseUrl = _supabaseUrl
    supabaseKey = _supabaseKey
    supabaseServiceRoleKey = _supabaseServiceRoleKey
  }

  supabase = createClient(supabaseUrl, supabaseKey)

  if (supabaseServiceRoleKey) {
    console.log("✅ Supabase initierad (med admin-behörigheter)")
  } else {
    console.log("✅ Supabase initierad (utan admin-behörigheter - användare kan inte radera sina auth-konton)")
  }
}

// Database Schema
// ================
// The initial database schema SQL is located in: src/db/migrations/001_initial_schema.sql
// Run that file in Supabase SQL Editor to create the initial tables.
//
// IMPORTANT: Database Migration Policy
// ------------------------------------
// - DO NOT modify 001_initial_schema.sql - it represents the production database state
// - For any database changes, create a new migration file with the next sequential number
//   (e.g., 002_add_new_feature.sql, 003_update_table.sql)
// - Each migration should be idempotent when possible (use IF NOT EXISTS, etc.)
// - Document the purpose of each migration at the top of the file
