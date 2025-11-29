export interface Profile {
  id: string // UUID from Supabase Auth
  email: string
  username: string
  contact_phone?: string
  contact_email?: string
  city?: string
  created_at: string
  updated_at: string
}

// Ad states: ok (visible), reported (hidden), expired (hidden), sold (hidden), deleted (hidden)
export type AdState = "ok" | "reported" | "expired" | "sold" | "deleted"

export interface Ad {
  id: number
  user_id: string // UUID
  title: string
  description: string
  price: number
  category: string
  city?: string
  state: AdState
  created_at: string
  updated_at: string
  expires_at: string
}

export interface Image {
  id: number
  ad_id: number
  filename: string
  storage_path: string
  created_at: string
}

export interface Conversation {
  id: number
  ad_id: number
  buyer_id: string // UUID
  seller_id: string // UUID
  created_at: string
  updated_at: string
  expires_at?: string // Set when ad is deleted (90 days retention)
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: string // UUID
  encrypted_content: string // End-to-end encrypted message
  iv: string // Initialization vector for decryption
  created_at: string
}

export const CATEGORIES = [
  "Fordon",
  "Elektronik",
  "Möbler",
  "Kläder",
  "Sport & Fritid",
  "Hem & Hushåll",
  "Barn & Baby",
  "Djur",
  "Hobby",
  "Övrigt",
] as const

export type Category = (typeof CATEGORIES)[number]
