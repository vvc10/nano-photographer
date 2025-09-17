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
		const { userFingerprint, userId } = body as { userFingerprint?: string; userId?: string }

		if (!userFingerprint && !userId) {
			return NextResponse.json({ error: "userFingerprint or userId required" }, { status: 400 })
		}

		const { id } = await ctx.params

		// Toggle semantics: prefer userId identity when provided
		let is_saved = false

		// First attempt delete for provided identity to unsave
		let delQuery = supabaseAdmin.from("style_saves").delete().eq("style_id", id)
		if (userId) delQuery = delQuery.eq("user_id", userId)
		else if (userFingerprint) delQuery = delQuery.eq("user_fingerprint", userFingerprint)
		const { data: delRows, error: delErr } = await delQuery.select()
		if (delErr) {
			console.error("save delete error:", delErr)
			return NextResponse.json({ error: delErr.message }, { status: 500 })
		}

		if (!delRows || delRows.length === 0) {
			// Nothing deleted; try insert
			const insertPayload: any = { style_id: id }
			if (userId) insertPayload.user_id = userId
			else if (userFingerprint) insertPayload.user_fingerprint = userFingerprint
			const { error: insErr } = await supabaseAdmin.from("style_saves").insert(insertPayload)
			if (insErr) {
				console.error("save insert error:", insErr)
				return NextResponse.json({ error: insErr.message }, { status: 500 })
			}
			is_saved = true
		} else {
			is_saved = false
		}

		// Update aggregate downloads count on styles table
		const { count, error: cntErr } = await supabaseAdmin
			.from("style_saves")
			.select("*", { count: "exact", head: true })
			.eq("style_id", id)
		if (cntErr) {
			console.error("save count error:", cntErr)
		} else {
			await supabaseAdmin.from("styles").update({ downloads: count || 0 }).eq("id", id)
		}

		return NextResponse.json({ data: { is_saved, save_count: (typeof count === "number" ? count : 0) } }, { status: 200 })
	} catch (err: any) {
		console.error("save POST error", err)
		return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 })
	}
}
