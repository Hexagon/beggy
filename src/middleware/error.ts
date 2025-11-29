import { Context, Next } from "@oak/oak"

export async function errorMiddleware(ctx: Context, next: Next): Promise<void> {
  try {
    await next()
  } catch (err) {
    console.error("Server error:", err)

    ctx.response.status = 500
    ctx.response.body = {
      error: "Ett fel uppstod. Försök igen senare.",
    }
  }
}
