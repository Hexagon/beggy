export interface Profile {
  id: string // UUID from Supabase Auth
  email: string
  name: string
  phone?: string
  city?: string
  created_at: string
  updated_at: string
}

export interface Ad {
  id: number
  user_id: string // UUID
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
  storage_path: string
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
