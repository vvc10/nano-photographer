export type Style = {
  id: string
  name: string
  prompt?: string | null
  description?: string | null
  category?: string | null
  cover_image_url?: string | null
  credits?: string | null
  trending?: boolean
  premium?: boolean
  likes?: number
  downloads?: number
  created_at?: string
  status?: string
  people_type?: string | null
  // Optional fields for UI compatibility with legacy Pin
  lang?: string
  code?: string
  image?: string
  videoUrl?: string
  author_id?: string
  badges?: string[]
}


