import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = createSupabaseClient()

    const body = await req.json()
    const { userFingerprint } = body

    if (!userFingerprint) {
      return NextResponse.json({ error: "userFingerprint required" }, { status: 400 })
    }

    const { id } = await ctx.params

    // Toggle: try to delete first; if nothing deleted, insert
    let is_liked = false
    const { data: delRows, error: delErr } = await supabaseAdmin
      .from("style_likes")
      .delete()
      .eq("style_id", id)
      .eq("user_fingerprint", userFingerprint)
      .select()
    if (delErr) {
      console.error("like delete error:", delErr)
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }
    if (!delRows || delRows.length === 0) {
      const { error: insErr } = await supabaseAdmin
        .from("style_likes")
        .insert({ style_id: id, user_id: null, user_fingerprint: userFingerprint })
      if (insErr) {
        console.error("like insert error:", insErr)
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
      is_liked = true
    } else {
      is_liked = false
    }

    // Update aggregate count on styles table
    const { count, error: cntErr } = await supabaseAdmin
      .from("style_likes")
      .select("*", { count: "exact", head: true })
      .eq("style_id", id)
    if (cntErr) {
      console.error("like count error:", cntErr)
    } else {
      await supabaseAdmin.from("styles").update({ likes: count || 0 }).eq("id", id)
    }

    return NextResponse.json({ data: { is_liked, like_count: count || 0 } }, { status: 200 })
  } catch (err: any) {
    console.error("like POST error:", err)
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 })
  }
}
