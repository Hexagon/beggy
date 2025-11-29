import { Router } from "@oak/oak"
import { getSupabase } from "../db/database.ts"
import { getUserFromRequest } from "./auth.ts"
import { decryptMessage, deriveConversationKey, encryptMessage } from "../utils/encryption.ts"
import { containsForbiddenWords } from "../utils/forbidden-words.ts"

const router = new Router()

// Server-side encryption secret (should be in environment variable)
const ENCRYPTION_SECRET = Deno.env.get("ENCRYPTION_SECRET") || "beggy-default-secret-key-change-me"

// Get all conversations for current user
router.get("/api/conversations", async (ctx) => {
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
    return
  }

  const supabase = getSupabase()

  // Get conversations where user is buyer or seller
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(`
      *,
      ads(id, title, state),
      buyer:profiles!conversations_buyer_id_fkey(username),
      seller:profiles!conversations_seller_id_fkey(username),
      messages(id, created_at)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("updated_at", { ascending: false })

  if (error) {
    ctx.response.status = 500
    ctx.response.body = { error: "Kunde inte hämta konversationer" }
    return
  }

  ctx.response.body = {
    conversations: (conversations || []).map((conv) => ({
      id: conv.id,
      ad_id: conv.ad_id,
      ad_title: conv.ads?.title || "Borttagen annons",
      ad_state: conv.ads?.state || "deleted",
      buyer_username: conv.buyer?.username || "Okänd",
      seller_username: conv.seller?.username || "Okänd",
      is_buyer: conv.buyer_id === user.id,
      message_count: conv.messages?.length || 0,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      expires_at: conv.expires_at,
    })),
  }
})

// Get messages in a conversation
router.get("/api/conversations/:id/messages", async (ctx) => {
  const conversationId = parseInt(ctx.params.id)
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
    return
  }

  const supabase = getSupabase()

  // Check if user is participant
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select(
      "*, ads(title, state), buyer:profiles!conversations_buyer_id_fkey(username), seller:profiles!conversations_seller_id_fkey(username)",
    )
    .eq("id", conversationId)
    .single()

  if (convError || !conversation) {
    ctx.response.status = 404
    ctx.response.body = { error: "Konversationen hittades inte" }
    return
  }

  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
    ctx.response.status = 403
    ctx.response.body = { error: "Du har inte tillgång till denna konversation" }
    return
  }

  // Get messages
  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(username)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (msgError) {
    ctx.response.status = 500
    ctx.response.body = { error: "Kunde inte hämta meddelanden" }
    return
  }

  // Decrypt messages
  const key = await deriveConversationKey(conversationId, ENCRYPTION_SECRET)
  const decryptedMessages = await Promise.all(
    (messages || []).map(async (msg) => {
      let content = ""
      try {
        content = await decryptMessage(msg.encrypted_content, msg.iv, key)
      } catch {
        content = "[Kunde inte dekryptera meddelande]"
      }
      return {
        id: msg.id,
        sender_id: msg.sender_id,
        sender_username: msg.sender?.username || "Okänd",
        is_own: msg.sender_id === user.id,
        content,
        created_at: msg.created_at,
      }
    }),
  )

  ctx.response.body = {
    conversation: {
      id: conversation.id,
      ad_id: conversation.ad_id,
      ad_title: conversation.ads?.title || "Borttagen annons",
      ad_state: conversation.ads?.state || "deleted",
      buyer_username: conversation.buyer?.username || "Okänd",
      seller_username: conversation.seller?.username || "Okänd",
      is_buyer: conversation.buyer_id === user.id,
      expires_at: conversation.expires_at,
    },
    messages: decryptedMessages,
  }
})

// Start a conversation or get existing one for an ad
router.post("/api/ads/:id/conversation", async (ctx) => {
  const adId = parseInt(ctx.params.id)
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad för att kontakta säljaren" }
    return
  }

  const supabase = getSupabase()

  // Get ad and check it's visible
  const { data: ad, error: adError } = await supabase
    .from("ads")
    .select("id, user_id, title, state")
    .eq("id", adId)
    .single()

  if (adError || !ad) {
    ctx.response.status = 404
    ctx.response.body = { error: "Annonsen hittades inte" }
    return
  }

  if (ad.state !== "ok") {
    ctx.response.status = 400
    ctx.response.body = { error: "Det går inte att kontakta säljaren för denna annons" }
    return
  }

  if (ad.user_id === user.id) {
    ctx.response.status = 400
    ctx.response.body = { error: "Du kan inte starta en konversation med dig själv" }
    return
  }

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("ad_id", adId)
    .eq("buyer_id", user.id)
    .single()

  if (existing) {
    ctx.response.body = {
      conversation_id: existing.id,
      message: "Konversation finns redan",
    }
    return
  }

  // Create new conversation
  const { data: newConv, error: convError } = await supabase
    .from("conversations")
    .insert({
      ad_id: adId,
      buyer_id: user.id,
      seller_id: ad.user_id,
      encryption_key: "server-managed", // Key is derived, not stored
    })
    .select("id")
    .single()

  if (convError) {
    ctx.response.status = 500
    ctx.response.body = { error: "Kunde inte skapa konversation" }
    return
  }

  ctx.response.status = 201
  ctx.response.body = {
    conversation_id: newConv.id,
    message: "Konversation skapad",
  }
})

// Send a message in a conversation
router.post("/api/conversations/:id/messages", async (ctx) => {
  const conversationId = parseInt(ctx.params.id)
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
    return
  }

  const body = await ctx.request.body.json()
  const { content } = body

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    ctx.response.status = 400
    ctx.response.body = { error: "Meddelandet kan inte vara tomt" }
    return
  }

  if (content.length > 2000) {
    ctx.response.status = 400
    ctx.response.body = { error: "Meddelandet är för långt (max 2000 tecken)" }
    return
  }

  // Check for forbidden words
  if (containsForbiddenWords({ content })) {
    ctx.response.status = 400
    ctx.response.body = { error: "Meddelandet innehåller otillåtna ord." }
    return
  }

  const supabase = getSupabase()

  // Check if user is participant
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, expires_at")
    .eq("id", conversationId)
    .single()

  if (convError || !conversation) {
    ctx.response.status = 404
    ctx.response.body = { error: "Konversationen hittades inte" }
    return
  }

  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
    ctx.response.status = 403
    ctx.response.body = { error: "Du har inte tillgång till denna konversation" }
    return
  }

  // Check if conversation is expired
  if (conversation.expires_at && new Date(conversation.expires_at) < new Date()) {
    ctx.response.status = 400
    ctx.response.body = { error: "Denna konversation har upphört" }
    return
  }

  // Encrypt the message
  const key = await deriveConversationKey(conversationId, ENCRYPTION_SECRET)
  const { encrypted, iv } = await encryptMessage(content.trim(), key)

  // Save message
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      encrypted_content: encrypted,
      iv,
    })
    .select("id, created_at")
    .single()

  if (msgError) {
    ctx.response.status = 500
    ctx.response.body = { error: "Kunde inte skicka meddelande" }
    return
  }

  // Update conversation updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)

  ctx.response.status = 201
  ctx.response.body = {
    message_id: message.id,
    created_at: message.created_at,
  }
})

export { router as messagesRouter }
