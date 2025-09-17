import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl || !serviceRoleKey) {
  console.error('/api/styles/saved missing env vars')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey as string, { auth: { persistSession: false } })

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const fingerprint = searchParams.get('fingerprint') || undefined
    const userId = searchParams.get('userId') || undefined

    // Prefer userId when available; fallback to fingerprint for anonymous
    let savedRows: any[] = []
    if (userId) {
      const { data, error } = await supabaseAdmin.from('style_saves').select('style_id').eq('user_id', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      savedRows = data || []
    } else if (fingerprint) {
      const { data, error } = await supabaseAdmin.from('style_saves').select('style_id').eq('user_fingerprint', fingerprint)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      savedRows = data || []
    } else {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const ids = savedRows.map((r: any) => r.style_id)
    if (ids.length === 0) return NextResponse.json({ data: [] }, { status: 200 })

    const { data: styles, error } = await supabaseAdmin
      .from('styles')
      .select('id, name, prompt, category, cover_image_url, trending, premium, likes, downloads, created_at, status')
      .in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: styles || [] }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
