"use client"
import { createBrowserClient } from "@supabase/ssr"

let _browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowser() {
  if (_browserClient) return _browserClient
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }
  
  _browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return _browserClient
}
