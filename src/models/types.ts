export interface Profile {
  id: string // UUID from Supabase Auth
  email: string
  username: string
  contact_phone?: string
  contact_email?: string
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
  county: string // Required Swedish county (län)
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

// Swedish counties (län)
export const COUNTIES = [
  "Blekinge",
  "Dalarna",
  "Gotland",
  "Gävleborg",
  "Halland",
  "Jämtland",
  "Jönköping",
  "Kalmar",
  "Kronoberg",
  "Norrbotten",
  "Skåne",
  "Stockholm",
  "Södermanland",
  "Uppsala",
  "Värmland",
  "Västerbotten",
  "Västernorrland",
  "Västmanland",
  "Västra Götaland",
  "Örebro",
  "Östergötland",
] as const

export type County = (typeof COUNTIES)[number]

// Adjacent counties mapping (which counties border each other)
export const ADJACENT_COUNTIES: Record<string, string[]> = {
  Blekinge: ["Skåne", "Kronoberg", "Kalmar"],
  Dalarna: ["Gävleborg", "Västernorrland", "Jämtland", "Värmland", "Örebro", "Västmanland"],
  Gotland: [], // Island - no adjacent counties
  Gävleborg: ["Dalarna", "Västernorrland", "Jämtland", "Uppsala", "Västmanland"],
  Halland: ["Skåne", "Västra Götaland", "Jönköping", "Kronoberg"],
  Jämtland: ["Västernorrland", "Västerbotten", "Dalarna", "Gävleborg", "Värmland"],
  Jönköping: ["Halland", "Västra Götaland", "Östergötland", "Kalmar", "Kronoberg"],
  Kalmar: ["Blekinge", "Kronoberg", "Jönköping", "Östergötland"],
  Kronoberg: ["Blekinge", "Skåne", "Halland", "Jönköping", "Kalmar"],
  Norrbotten: ["Västerbotten"],
  Skåne: ["Blekinge", "Kronoberg", "Halland"],
  Stockholm: ["Uppsala", "Södermanland"],
  Södermanland: ["Stockholm", "Uppsala", "Västmanland", "Örebro", "Östergötland"],
  Uppsala: ["Stockholm", "Södermanland", "Västmanland", "Gävleborg"],
  Värmland: ["Dalarna", "Örebro", "Västra Götaland", "Jämtland"],
  Västerbotten: ["Norrbotten", "Västernorrland", "Jämtland"],
  Västernorrland: ["Västerbotten", "Jämtland", "Gävleborg", "Dalarna"],
  Västmanland: ["Uppsala", "Gävleborg", "Dalarna", "Örebro", "Södermanland"],
  "Västra Götaland": ["Halland", "Jönköping", "Östergötland", "Örebro", "Värmland"],
  Örebro: ["Värmland", "Dalarna", "Västmanland", "Södermanland", "Östergötland", "Västra Götaland"],
  Östergötland: ["Södermanland", "Örebro", "Västra Götaland", "Jönköping", "Kalmar"],
}
