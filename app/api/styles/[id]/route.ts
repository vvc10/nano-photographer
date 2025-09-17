import { NextRequest } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { name, description, full_prompt, cover_image_url, credits, visibility, curated } = body

    const supabase = await getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: "Authentication required" }, { status: 401 })
    }

    // Only author or admin can update (RLS also enforces)
    const { data: updated, error } = await supabase
      .from('styles')
      .update({
        name,
        description,
        full_prompt,
        cover_image_url,
        credits,
        visibility,
        curated
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message || 'Failed to update style' }, { status: 500 })
    }

    return Response.json(updated, { status: 200 })
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}


