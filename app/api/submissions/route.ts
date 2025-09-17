import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined

if (!supabaseUrl || !serviceRoleKey) {
  console.error("/api/submissions missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

// Use service role for writes to avoid RLS issues
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey as string, {
  auth: { persistSession: false },
})

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server missing Supabase env vars" }, { status: 500 })
    }

    const body = await req.json()
    const { type, title, content, image } = body

    // Validate required fields
    if (!type || !title || !content) {
      return NextResponse.json({ 
        error: "Missing required fields: type, title, and content are required" 
      }, { status: 400 })
    }

    // Validate type
    if (!['prompt', 'suggestion'].includes(type)) {
      return NextResponse.json({ 
        error: "Invalid type. Must be 'prompt' or 'suggestion'" 
      }, { status: 400 })
    }

    // Validate content length
    if (title.length > 255) {
      return NextResponse.json({ 
        error: "Title too long. Maximum 255 characters" 
      }, { status: 400 })
    }

    if (content.length > 10000) {
      return NextResponse.json({ 
        error: "Content too long. Maximum 10,000 characters" 
      }, { status: 400 })
    }

    // Get user fingerprint from request headers (if available)
    const fingerprint = req.headers.get('x-fingerprint') || 
                      req.headers.get('user-agent')?.slice(0, 50) || 
                      'anonymous'

    // Insert submission
    const { data, error } = await supabaseAdmin
      .from("prompt_submissions")
      .insert({
        type,
        title: title.trim(),
        content: content.trim(),
        image_url: image?.trim() || null,
        user_fingerprint: fingerprint,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error("Submission insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      data, 
      message: "Submission received successfully" 
    }, { status: 201 })

  } catch (err: any) {
    console.error("Submission error:", err)
    return NextResponse.json({ 
      error: err?.message || "Unknown error" 
    }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "all"
    const status = searchParams.get("status") || "all"
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50", 10) || 50, 100)
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10) || 0

    let query = supabaseAdmin
      .from("prompt_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (type !== "all") {
      query = query.eq("type", type)
    }

    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Submissions fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })

  } catch (err: any) {
    console.error("Submissions fetch error:", err)
    return NextResponse.json({ 
      error: err?.message || "Unknown error" 
    }, { status: 500 })
  }
}
