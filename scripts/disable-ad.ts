// Disable (delete) an ad by id and resolve related reports
import { setupEnv, getEnv } from "jsr:@cross/env"
import { initDatabase, getAdminSupabase } from "../src/db/database.ts"

async function main() {
  const idArg = Deno.args[0]
  if (!idArg || isNaN(Number(idArg))) {
    console.error("Usage: deno task disable-ad <ad_id>")
    Deno.exit(1)
  }
  const adId = Number(idArg)

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

  // Update ad state to 'deleted'
  const { data: adRow, error: updErr } = await admin
    .from("ads")
    .update({ state: "deleted" })
    .eq("id", adId)
    .select("id, title, state")
    .maybeSingle()

  if (updErr) {
    console.error("Failed to disable ad:", updErr.message)
    Deno.exit(1)
  }
  if (!adRow) {
    console.error("Ad not found:", adId)
    Deno.exit(1)
  }

  // Resolve related pending reports
  const { error: repErr } = await admin
    .from("reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("ad_id", adId)
    .eq("status", "pending")

  if (repErr) {
    console.error("Ad disabled, but failed to resolve reports:", repErr.message)
    Deno.exit(1)
  }

  console.log(`✅ Disabled ad #${adRow.id} (${adRow.title}) and resolved reports`)
}

if (import.meta.main) {
  await main()
}
