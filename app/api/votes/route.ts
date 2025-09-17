import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl || !serviceRoleKey) {
	console.error("/api/votes missing env vars")
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
	auth: { persistSession: false },
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pinId = searchParams.get("pinId")
	const userId = searchParams.get("userId") || undefined
	const userFingerprint = searchParams.get("fingerprint") || undefined
  
	console.log("GET /api/votes", { pinId, userId, userFingerprint })
  if (!pinId) return NextResponse.json({ error: "pinId required" }, { status: 400 })
  
  try {
		// Count likes for this style
		const { count, error: cntErr } = await supabaseAdmin
			.from("style_likes")
			.select("*", { count: "exact", head: true })
			.eq("style_id", pinId)
		if (cntErr) {
			console.error("votes count error:", cntErr)
			return NextResponse.json({ error: "Failed to fetch vote data" }, { status: 500 })
		}

		let isLiked = false
		if (userId || userFingerprint) {
			let query = supabaseAdmin
				.from("style_likes")
				.select("style_id")
				.eq("style_id", pinId)
				.limit(1)
			if (userId) query = query.eq("user_id", userId)
			else if (userFingerprint) query = query.eq("user_fingerprint", userFingerprint)
			const { data: likeRow, error: likeErr } = await query.maybeSingle()
			if (likeErr) {
				console.error("votes like check error:", likeErr)
			} else {
				isLiked = Boolean(likeRow)
			}
		}

		return NextResponse.json({ pinId, count: count || 0, isLiked })
  } catch (error) {
		console.error("GET /api/votes error:", error)
    return NextResponse.json({ error: "Failed to fetch vote data" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
	const body = await req.json().catch(() => null as any)
  const pinId = body?.pinId as string | undefined
	const userId = (body?.userId as string | undefined) || undefined
	const userFingerprint = (body?.userFingerprint as string | undefined) || undefined

	console.log("POST /api/votes", { pinId, userId, hasFingerprint: Boolean(userFingerprint) })
	if (!pinId || (!userId && !userFingerprint)) {
		return NextResponse.json({ error: "pinId and userId or userFingerprint required" }, { status: 400 })
  }
  
  try {
		// Toggle: try delete first
		let isLiked = false
		let delQuery = supabaseAdmin.from("style_likes").delete().eq("style_id", pinId)
		if (userId) delQuery = delQuery.eq("user_id", userId)
		else if (userFingerprint) delQuery = delQuery.eq("user_fingerprint", userFingerprint)
		const { data: delRows, error: delErr } = await delQuery.select()
		if (delErr) {
			console.error("votes delete error:", delErr)
			return NextResponse.json({ error: delErr.message }, { status: 500 })
		}
		if (!delRows || delRows.length === 0) {
			const insertPayload: any = { style_id: pinId }
			if (userId) insertPayload.user_id = userId
			else if (userFingerprint) insertPayload.user_fingerprint = userFingerprint
			const { error: insErr } = await supabaseAdmin
				.from("style_likes")
				.insert(insertPayload)
			if (insErr) {
				console.error("votes insert error:", insErr)
				return NextResponse.json({ error: insErr.message }, { status: 500 })
			}
			isLiked = true
    } else {
      isLiked = false
		}

		// Update aggregate count on styles table
		const { count, error: cntErr } = await supabaseAdmin
			.from("style_likes")
			.select("*", { count: "exact", head: true })
			.eq("style_id", pinId)
		if (cntErr) {
			console.error("votes count error:", cntErr)
		} else {
			await supabaseAdmin.from("styles").update({ likes: count || 0 }).eq("id", pinId)
		}

		return NextResponse.json({ pinId, count: count || 0, isLiked })
  } catch (error) {
		console.error("POST /api/votes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
