import type { NextRequest } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return Response.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Try server client first (will respect current session if present)
    let supabase = await getSupabaseServer()

    // Get the current user (if any)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // If there's no authenticated user, fall back to admin client so anonymous uploads are allowed
    if (authError || !user) {
      // Use admin client (server-only) to perform the upload without requiring a logged-in session
      supabase = getSupabaseAdmin()
    }

    // Generate unique filename. If user exists, namespace by user id; otherwise use anonymous UUID
    const fileExt = (file.name && file.name.split('.').pop()) || 'png'
    const prefix = user ? user.id : `anonymous`;
    const uuid = typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}`
    const fileName = `${prefix}/${uuid}.${fileExt}`

    // Resolve storage bucket from env (default to ig-styles)
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'ig-styles'

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      return Response.json({ error: "Failed to upload image" }, { status: 500 })
    }

    // Get public URL
    const publicUrlData = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    const publicUrl = publicUrlData?.data?.publicUrl ?? null

    return Response.json({
      url: publicUrl,
      path: data?.path ?? null
    })
  } catch (error) {
    console.error('Error in upload API:', error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
