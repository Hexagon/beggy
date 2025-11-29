export interface User {
  id: number
  email: string
  password_hash: string
  name: string
  phone?: string
  city?: string
  created_at: string
  updated_at: string
}

export interface Ad {
  id: number
  user_id: number
  title: string
  description: string
  price: number
  category: string
  city?: string
  status: "active" | "sold" | "deleted"
  created_at: string
  updated_at: string
}

export interface Image {
  id: number
  ad_id: number
  filename: string
  created_at: string
}

export interface Session {
  id: string
  user_id: number
  created_at: string
  expires_at: string
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
