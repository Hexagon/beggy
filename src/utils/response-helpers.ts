import { Context } from "@oak/oak"

/**
 * Response helper functions to reduce code duplication in route handlers
 */

type ResponseBody = Record<string, unknown> | string | number | boolean | null | undefined

export function sendError(ctx: Context, status: number, message: string): void {
  ctx.response.status = status
  ctx.response.body = { error: message }
}

export function sendSuccess(ctx: Context, data: ResponseBody, status = 200): void {
  ctx.response.status = status
  ctx.response.body = data
}

export function sendBadRequest(ctx: Context, message: string): void {
  sendError(ctx, 400, message)
}

export function sendUnauthorized(ctx: Context, message = "Du måste vara inloggad"): void {
  sendError(ctx, 401, message)
}

export function sendForbidden(
  ctx: Context,
  message = "Du har inte behörighet att utföra denna åtgärd",
): void {
  sendError(ctx, 403, message)
}

export function sendNotFound(ctx: Context, message = "Resursen hittades inte"): void {
  sendError(ctx, 404, message)
}

export function sendServerError(ctx: Context, message = "Ett fel uppstod"): void {
  sendError(ctx, 500, message)
}

export function sendCreated(ctx: Context, data: ResponseBody): void {
  sendSuccess(ctx, data, 201)
}
