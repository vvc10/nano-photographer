"use client"
import { createBrowserClient } from "@supabase/ssr"

let _browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowser() {
  if (_browserClient) return _browserClient
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or when environment variables are missing,
    // return a mock client to prevent build failures
    console.warn("Supabase environment variables not available, using mock client")
    return null as any
  }
  
  _browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return _browserClient
}
