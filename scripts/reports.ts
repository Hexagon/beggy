// List reported ads (pending reports) with basic ad info
import { setupEnv, getEnv } from "jsr:@cross/env"
import { initDatabase, getAdminSupabase } from "../src/db/database.ts"

async function main() {
  // Load .env and read required env vars
  await setupEnv({ dotEnv: { enabled: true } })
  const SUPABASE_URL = getEnv("SUPABASE_URL")
  const SUPABASE_ANON_KEY = getEnv("SUPABASE_ANON_KEY")
  const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY")

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY")
    Deno.exit(1)
  }

  initDatabase(SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
  const admin = getAdminSupabase()

  // Fetch pending reports
  const { data, error } = await admin
    .from("reports")
    .select("id, ad_id, reason, details, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch reports:", error.message)
    Deno.exit(1)
  }

  if (!data || data.length === 0) {
    console.log("No pending reports.")
    return
  }

  // Pretty print
  for (const r of data as Array<any>) {
    const { data: ad, error: adErr } = await admin
      .from("ads")
      .select("id, title, state, user_id")
      .eq("id", r.ad_id)
      .maybeSingle()

    if (adErr) {
      console.log(
        `#${r.id} | ad:${r.ad_id} | title:"(error fetching ad)" | reason:${r.reason} | created:${r.created_at}`,
      )
    } else {
      console.log(
        `#${r.id} | ad:${r.ad_id} | title:"${ad?.title ?? "(unknown)"}" | state:${ad?.state ?? "?"} | reason:${r.reason} | created:${r.created_at}`,
      )
    }
    if (r.details) console.log(`  details: ${r.details}`)
  }
}

if (import.meta.main) {
  await main()
}
