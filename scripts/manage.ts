// Unified task runner: deno task manage <command> [...args]
// Commands: reports, disable-ad <id>, cleanup-deleted-ads [--dry-run], revive-ad <id>
import { setupEnv, getEnv } from "jsr:@cross/env"
import { initDatabase, getAdminSupabase } from "../src/db/database.ts"

async function main() {
  const [cmd, ...args] = Deno.args
  if (!cmd) {
    printHelp()
    Deno.exit(1)
  }

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

  switch (cmd) {
    case "reports": {
      await listReports(admin)
      break
    }
    case "disable-ad": {
      const idArg = args[0]
      if (!idArg || isNaN(Number(idArg))) return usage("disable-ad <ad_id>")
      await disableAd(admin, Number(idArg))
      break
    }
    case "cleanup": {
      const dryRun = args.includes("--dry-run")
      await cleanup(admin, dryRun)
      break
    }
    case "revive-ad": {
      const idArg = args[0]
      if (!idArg || isNaN(Number(idArg))) return usage("revive-ad <ad_id>")
      await reviveAd(admin, Number(idArg))
      break
    }
    default:
      console.error(`Unknown command: ${cmd}`)
      printHelp()
      Deno.exit(1)
  }
}

function usage(u: string) {
  console.error("Usage:", `deno task manage ${u}`)
}

function printHelp() {
  console.log("Usage: deno task manage <command> [...args]")
  console.log("Commands:")
  console.log("  reports                      List pending reports")
  console.log("  disable-ad <ad_id>           Disable an ad and resolve reports")
  console.log("  cleanup [--dry-run]             Purge old ads (deleted, expired, sold>5d) + images")
  console.log("  revive-ad <ad_id>            Revive reported ad to ok and resolve reports")
}

async function listReports(admin: ReturnType<typeof getAdminSupabase>) {
  const { data, error } = await admin
    .from("reports")
    .select("id, ad_id, reason, details, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
  if (error) throw new Error(`Failed to fetch reports: ${error.message}`)
  if (!data || data.length === 0) {
    console.log("No pending reports.")
    return
  }
  for (const r of data as Array<any>) {
    const { data: ad } = await admin
      .from("ads")
      .select("id, title, state, user_id")
      .eq("id", r.ad_id)
      .maybeSingle()
    console.log(
      `#${r.id} | ad:${r.ad_id} | title:"${ad?.title ?? "(unknown)"}" | state:${ad?.state ?? "?"} | reason:${r.reason} | created:${r.created_at}`,
    )
    if (r.details) console.log(`  details: ${r.details}`)
  }
}

async function disableAd(admin: ReturnType<typeof getAdminSupabase>, adId: number) {
  const { data: adRow, error: updErr } = await admin
    .from("ads").update({ state: "deleted" }).eq("id", adId)
    .select("id, title, state").maybeSingle()
  if (updErr) throw new Error(`Failed to disable ad: ${updErr.message}`)
  if (!adRow) throw new Error(`Ad not found: ${adId}`)
  const { error: repErr } = await admin
    .from("reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("ad_id", adId)
    .eq("status", "pending")
  if (repErr) throw new Error(`Ad disabled, but failed to resolve reports: ${repErr.message}`)
  console.log(`✅ Disabled ad #${adRow.id} (${adRow.title}) and resolved reports`)
}

async function cleanup(admin: ReturnType<typeof getAdminSupabase>, dryRun: boolean) {
  // Collect ads to purge: deleted, expired, or sold older than 5 days
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

  const { data: toDelete, error: listErr } = await admin
    .from("ads")
    .select("id, title, state, updated_at, expires_at")
    .or(
      `state.eq.deleted,state.eq.expired,state.eq.sold.and(updated_at.lt.${fiveDaysAgo})`
    )
    .order("updated_at", { ascending: false })
  if (listErr) throw new Error(`Failed to list ads to purge: ${listErr.message}`)
  const adsToPurge = (toDelete || []) as Array<{ id: number; title: string }>
  if (adsToPurge.length === 0) {
    console.log("No ads to purge (deleted, expired, or sold>5d).")
    return
  }
  console.log(`${dryRun ? "[DRY-RUN] " : ""}Found ${adsToPurge.length} ad(s) to purge.`)
  for (const ad of adsToPurge) {
    const { data: images } = await admin
      .from("images").select("id, storage_path").eq("ad_id", ad.id)
    const imagePaths = (images || []).map((i: { storage_path: string }) => i.storage_path)
    console.log(`${dryRun ? "[DRY-RUN] " : ""}Cleaning ad #${ad.id} (${ad.title}) with ${imagePaths.length} image(s)`)    
    if (!dryRun && imagePaths.length > 0) {
      await admin.storage.from("ad-images").remove(imagePaths)
    }
    if (!dryRun) {
      const { error: delConvErr } = await admin.from("conversations").delete().eq("ad_id", ad.id)
      if (delConvErr) {
        console.error(`Failed to delete conversations for ad #${ad.id}:`, delConvErr.message)
        continue
      }
      await admin.from("images").delete().eq("ad_id", ad.id)
      await admin.from("ads").delete().eq("id", ad.id)
    }
    console.log(`${dryRun ? "[DRY-RUN] " : ""}✔ Processed ad #${ad.id} (${ad.title})`)
  }
}

async function reviveAd(admin: ReturnType<typeof getAdminSupabase>, adId: number) {
  const { data: adRow, error: updErr } = await admin
    .from("ads").update({ state: "ok" }).eq("id", adId)
    .select("id, title, state").maybeSingle()
  if (updErr) throw new Error(`Failed to revive ad: ${updErr.message}`)
  if (!adRow) throw new Error(`Ad not found: ${adId}`)
  const { error: repErr } = await admin
    .from("reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("ad_id", adId)
    .eq("status", "pending")
  if (repErr) throw new Error(`Ad revived, but failed to resolve reports: ${repErr.message}`)
  console.log(`✅ Revived ad #${adRow.id} (${adRow.title}) and resolved pending reports`)
}

if (import.meta.main) {
  await main()
}
