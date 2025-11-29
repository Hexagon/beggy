import { Context, Next } from "@oak/oak"
import { getDatabase } from "../db/database.ts"

export interface AuthState {
  userId?: number
  userEmail?: string
}

export async function authMiddleware(ctx: Context, next: Next): Promise<void> {
  const sessionId = await ctx.cookies.get("session")

  if (sessionId) {
    const db = getDatabase()
    const session = db.prepare(`
      SELECT s.user_id, u.email 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.id = ? AND datetime(s.expires_at) > datetime('now')
    `).get<[number, string]>(sessionId)

    if (session) {
      ctx.state.userId = session[0]
      ctx.state.userEmail = session[1]
    }
  }

  await next()
}

export function requireAuth(ctx: Context): boolean {
  if (!ctx.state.userId) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
    return false
  }
  return true
}
