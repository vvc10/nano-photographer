import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { TAG_OPTIONS } from "@/lib/tag-constants"

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

export async function GET(req: Request) {
  try {
    const supabaseAdmin = createSupabaseClient()
    const { searchParams } = new URL(req.url)
    const fingerprint = searchParams.get("fingerprint") || undefined
    const q = (searchParams.get("q") || "").trim()
    const lang = (searchParams.get("lang") || "all").toLowerCase()
    const tagsParam = searchParams.get("tags") || ""
    const cursor = Number.parseInt(searchParams.get("cursor") || "0", 10)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "18", 10) || 18, 100)
    const type = (searchParams.get("type") || "all").toLowerCase()

    // Base query builder (avoid selecting columns that may not exist across DBs)
    const buildBaseQuery = () =>
      supabaseAdmin
        .from("styles")
        .select(
          "id, slug, name, prompt, description, category, cover_image_url, credits, tags, trending, premium, likes, downloads, created_at, status",
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(cursor, Math.max(cursor, cursor + limit - 1))

    // Tag filter maps to category - handle both new key values and legacy values
    const tags = tagsParam
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => t.toLowerCase() !== "all")

    // Map filter values to database values (both new keys and legacy values)
    const mapFilterToDbValues = (filterValues: string[]): string[] => {
      const dbValues = new Set<string>()
      
      for (const filterValue of filterValues) {
        // Find matching tag option
        const tagOption = TAG_OPTIONS.find(tag => tag.key === filterValue)
        
        if (tagOption) {
          // Add the new dbValue
          dbValues.add(tagOption.dbValue)
          // Add legacy values for backward compatibility
          if (tagOption.legacyValues) {
            tagOption.legacyValues.forEach(legacy => dbValues.add(legacy))
          }
        } else {
          // If not found in TAG_OPTIONS, use the value as-is (for legacy compatibility)
          dbValues.add(filterValue)
        }
      }
      
      return Array.from(dbValues)
    }

    // Prepare base
    let base = buildBaseQuery()
    if (tags.length > 0) {
      const dbValues = mapFilterToDbValues(tags)
      base = base.in("category", dbValues)
    }

    // Optional text search on name or prompt
    if (q.length > 0) {
      base = base.or(`name.ilike.%${q}%,prompt.ilike.%${q}%`)
    }

    // Optional language filter (best-effort)
    if (lang && lang !== "all") {
      try {
        base = base.eq("lang", lang)
      } catch {}
    }

    // Execute with people_type filtering
    let data: any[] | null = null
    let error: any = null

    if (type && type !== "all") {
      // Add people_type filter to the base query (enum type)
      console.log(`Filtering by people_type: ${type}`)
      
      // First, let's check what values exist in the database
      const { data: sampleData } = await supabaseAdmin
        .from("styles")
        .select("people_type")
        .limit(10)
      
      console.log("Sample people_type values in DB:", sampleData?.map(s => s.people_type))
      
      base = base.eq("people_type", type)
    }
    
    const res = await base
    data = res.data as any[]
    error = res.error

    if (error) {
      console.error("API Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${data?.length || 0} styles for type: ${type}`)

    if (!fingerprint) {
      return NextResponse.json({ data }, { status: 200 })
    }

    const styleIds = (data || []).map((s: any) => s.id)
    if (styleIds.length === 0) return NextResponse.json({ data }, { status: 200 })

    const [{ data: likedRows }, { data: savedRows }] = await Promise.all([
      supabaseAdmin
        .from("style_likes")
        .select("style_id")
        .eq("user_fingerprint", fingerprint)
        .in("style_id", styleIds),
      supabaseAdmin
        .from("style_saves")
        .select("style_id")
        .eq("user_fingerprint", fingerprint)
        .in("style_id", styleIds),
    ])

    const likedSet = new Set((likedRows || []).map((r: any) => r.style_id))
    const savedSet = new Set((savedRows || []).map((r: any) => r.style_id))

    // Also compute like/save counts from respective tables
    const [{ data: allLikes }, { data: allSaves }] = await Promise.all([
      supabaseAdmin.from("style_likes").select("style_id").in("style_id", styleIds),
      supabaseAdmin.from("style_saves").select("style_id").in("style_id", styleIds),
    ])

    const likeCountMap = new Map<string, number>()
    for (const r of allLikes || []) {
      likeCountMap.set(r.style_id, (likeCountMap.get(r.style_id) || 0) + 1)
    }
    const saveCountMap = new Map<string, number>()
    for (const r of allSaves || []) {
      saveCountMap.set(r.style_id, (saveCountMap.get(r.style_id) || 0) + 1)
    }

    const enriched = (data || []).map((s: any) => ({
      ...s,
      _is_liked: likedSet.has(s.id),
      _is_saved: savedSet.has(s.id),
      _like_count: likeCountMap.get(s.id) || 0,
      _save_count: saveCountMap.get(s.id) || 0,
    }))

    return NextResponse.json({ data: enriched }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createSupabaseClient()
    const body = await req.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const prompt =
      (typeof body.prompt === "string" && body.prompt) ||
      (typeof body.full_prompt === "string" && body.full_prompt) ||
      null
    const description = typeof body.description === "string" ? body.description.trim() : null

    // Normalize credits from common variants and coerce to string
    const rawCredits =
      body.credits ?? body.credit ?? body.designer ?? body.ui_credit ?? body.attribution ?? null
    const credits =
      rawCredits == null
        ? null
        : typeof rawCredits === "string"
        ? rawCredits.trim()
        : Array.isArray(rawCredits)
        ? rawCredits.map((v) => String(v)).join(", ")
        : typeof rawCredits === "number"
        ? String(rawCredits)
        : typeof rawCredits === "object"
        ? JSON.stringify(rawCredits)
        : String(rawCredits)

    const coverUrl =
      (typeof body.cover_image_url === "string" && body.cover_image_url) ||
      (typeof body.coverImageUrl === "string" && body.coverImageUrl) ||
      (typeof body.image_url === "string" && body.image_url) ||
      (typeof body.imageUrl === "string" && body.imageUrl) ||
      null

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60)
    // append short random to reduce collisions
    const candidateSlug = `${baseSlug || "style"}-${Math.random().toString(36).slice(2, 6)}`

    // Insert minimal required fields to avoid column-mismatch errors
    const baseInsert: any = { name, slug: candidateSlug, status: "pending" }
    if (prompt !== null) baseInsert.prompt = prompt
    if (description !== null) baseInsert.description = description
    if (coverUrl !== null) baseInsert.cover_image_url = coverUrl
    if (credits !== null && credits.length > 0) baseInsert.credits = credits

    const { data: created, error } = await supabaseAdmin.from("styles").insert(baseInsert).select("*").single()
    if (error) {
      // eslint-disable-next-line no-console
      console.error("styles insert error:", { message: error.message, details: (error as any).details, hint: (error as any).hint, code: (error as any).code })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Best-effort updates for optional fields; ignore errors if columns don't exist
    const optionalUpdates: Record<string, any> = {}
    if (typeof body.category === "string") optionalUpdates.category = body.category
    if (description !== null) optionalUpdates.description = description
    if (coverUrl !== null) optionalUpdates.cover_image_url = coverUrl
    if (typeof body.trending !== "undefined") optionalUpdates.trending = !!body.trending
    if (typeof body.premium !== "undefined") optionalUpdates.premium = !!body.premium
    if (credits !== null && credits.length > 0) optionalUpdates.credits = credits
    if (typeof body.people_type === 'string' && body.people_type) optionalUpdates.people_type = String(body.people_type).toLowerCase()
    // Tags: accept array of strings, or comma-separated string
    if (Array.isArray(body.tags)) {
      optionalUpdates.tags = body.tags.filter((t: any) => typeof t === 'string' && t.trim().length > 0).map((t: string) => t.trim())
    } else if (typeof body.tags === 'string') {
      optionalUpdates.tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    }

    if (Object.keys(optionalUpdates).length > 0) {
      const { error: updErr } = await supabaseAdmin
        .from("styles")
        .update(optionalUpdates)
        .eq("id", created.id)
      if (updErr) {
        // swallow optional column errors
        // eslint-disable-next-line no-console
        console.warn("styles optional update warning:", updErr.message)
      }
    }

    // Return latest row (avoid selecting uncertain columns)
    const { data: finalRow } = await supabaseAdmin
      .from("styles")
      .select("id, slug, name, prompt, description, category, cover_image_url, credits, tags, trending, premium, likes, downloads, created_at")
      .eq("id", created.id)
      .single()

    return NextResponse.json({ data: finalRow ?? created }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 })
  }
}

// Removed legacy authenticated POST handler to avoid duplicate exports and auth requirement.
