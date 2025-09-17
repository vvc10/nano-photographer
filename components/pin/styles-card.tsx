"use client"

import { useMemo, useState, useCallback } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Heart, PlayCircle, Edit, Check, Code, Text, Share2 } from "lucide-react"
import { VideoLightbox } from "@/components/reels/video-lightbox"
import { EditPinModal } from "@/components/pin/edit-pin-modal"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useResponsive } from "@/hooks/use-responsive"
import { useRealtimeVotes } from "@/hooks/use-realtime-votes"
import { useSavedstyles } from "@/hooks/use-saved-styles"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const LANG_HOVER_SHADOW: Record<string, string> = {
  javascript: "hover:shadow-[0_0_0_2px_rgba(241,224,90,0.7)]",
  typescript: "hover:shadow-[0_0_0_2px_rgba(56,189,248,0.7)]",
  python: "hover:shadow-[0_0_0_2px_rgba(37,99,235,0.7)]",
  css: "hover:shadow-[0_0_0_2px_rgba(99,102,241,0.7)]",
  go: "hover:shadow-[0_0_0_2px_rgba(14,165,233,0.7)]",
  rust: "hover:shadow-[0_0_0_2px_rgba(251,113,133,0.7)]",
  sql: "hover:shadow-[0_0_0_2px_rgba(139,92,246,0.7)]",
}

export function StylesCard({
  pin,
  onTagClick,
  onLangClick,
  isInBoard = false,
  onRemoveFromBoard,
}: {
  pin: any | undefined
  onTagClick?: (tag: string) => void
  onLangClick?: (lang: string) => void
  isInBoard?: boolean
  onRemoveFromBoard?: () => void
}) {
  if (!pin) {
    return (
      <article className="rounded-2xl bg-card text-card-foreground shadow-lg p-6">
        <div className="h-40 bg-muted rounded-md mb-3" />
        <div className="h-4 w-3/4 bg-muted rounded mb-2" />
        <div className="h-3 w-1/2 bg-muted rounded" />
      </article>
    )
  }

  const p = useMemo(() => {
    const id = pin.id ?? pin.style_id ?? pin._id ?? pin.sid ?? ''
    const title = pin.title ?? pin.name ?? ''
    const image = pin.image ?? pin.cover_image_url ?? pin.image_url ?? pin.cover_image ?? '/placeholder.svg'
    const lang = pin.lang ?? pin.language ?? ''
    const tags = pin.tags ?? (pin.categories ? (Array.isArray(pin.categories) ? pin.categories : [pin.categories]) : [])
    const videoUrl = pin.videoUrl ?? pin.video_url ?? undefined
    const code = pin.code ?? pin.prompt ?? ''
    const badges = pin.badges ?? []
    const author_id = pin.author_id ?? pin.user_id ?? pin.authorId ?? null
    const _is_saved = (pin as any)._is_saved ?? (pin as any).is_saved ?? false
    const _save_count = (pin as any)._save_count ?? (pin as any).save_count ?? 0
    const _like_count = (pin as any)._like_count ?? (pin as any).like_count ?? 0
    return { ...pin, id, title, image, lang, tags, videoUrl, code, badges, author_id, _is_saved, _save_count, _like_count }
  }, [pin])

  // no board dialog - saves go directly to DB with userFingerprint
  const [videoOpen, setVideoOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const { user } = useAuth()
  const { breakpoint, columns } = useResponsive()
  const { voteCount: realtimeVoteCount, isLiked, isConnected, currentUserId, broadcastVote, fingerprint } = useRealtimeVotes(p.id)
  const { isstylesaved, addToSaved, removeFromSaved, refetch } = useSavedstyles()
  const serverIsSaved = (p as any)._is_saved ?? false
  const isSaved = isstylesaved(p.id) || Boolean(serverIsSaved)

  const hoverShadow = useMemo(() => LANG_HOVER_SHADOW[p.lang] || "hover:shadow-[0_0_0_2px_rgba(139,92,246,0.6)]", [p.lang])

  const { data: badgesData } = useSWR<{ pinId: string; badges: string[] }>(
    `/api/badges?pinId=${p.id}&lang=${encodeURIComponent(p.lang)}&tags=${encodeURIComponent((p.tags || []).join(","))}`,
    fetcher,
    { fallbackData: { pinId: p.id, badges: p.badges ?? [] } },
  )

  const router = useRouter()
  const handleShare = useCallback(async () => {
    try {
      const slugOrId = (p as any).slug || p.id
      const url = `${window.location.origin}/styles/${slugOrId}`
      const shareData: ShareData = { title: p.title, text: p.title, url }
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('🔗 Link copied!', { description: 'Style URL copied to clipboard', duration: 2500 })
      }
    } catch (e) {
      const slugOrId = (p as any).slug || p.id
      await navigator.clipboard.writeText(`${window.location.origin}/styles/${slugOrId}`)
      toast.success('🔗 Link copied!', { description: 'Style URL copied to clipboard', duration: 2500 })
    }
  }, [p.id, p.title])

  const openWithUrl = useCallback(() => {
    const slugOrId = (p as any).slug || p.id
    router.push(`/styles/${slugOrId}`)
  }, [router, p.id])

  const handleLike = useCallback(async () => {
    // Optimistic update: flip local liked state immediately
    const newIsLiked = !isLiked
    broadcastVote(0, newIsLiked, newIsLiked ? 'like' : 'unlike')

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId: p.id, userId: currentUserId, userFingerprint: currentUserId ? undefined : fingerprint }),
      })

      if (response.ok) {
        const data = await response.json()
        broadcastVote(data.count, data.isLiked, data.isLiked ? 'like' : 'unlike')
        toast.success(data.isLiked ? '❤️ Liked!' : '💔 Unliked', {
          description: data.isLiked ? `Added "${p.title}" to your liked styles` : `Removed "${p.title}" from your liked styles`,
          duration: 3000,
        })
      } else {
        // Revert optimistic update
        broadcastVote(0, isLiked, isLiked ? 'like' : 'unlike')
        toast.error('❌ Failed to Like', { description: 'Something went wrong. Please try again.', duration: 3000 })
      }
    } catch (error) {
      console.error('Error toggling vote:', error)
      broadcastVote(0, isLiked, isLiked ? 'like' : 'unlike')
      toast.error('❌ Failed to Like', { description: 'Something went wrong. Please try again.', duration: 3000 })
    }
  }, [p.id, p.title, currentUserId, isLiked, broadcastVote, fingerprint])

  return (
    <>
      <article className={`group relative overflow-hidden rounded-2xl bg-card text-card-foreground shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${hoverShadow}`} style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
        <div role="button" tabIndex={0} className="relative block w-full text-left" onClick={openWithUrl} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWithUrl() } }} aria-label={`Open ${p.title}`}>
          <img src={p.image || '/placeholder.svg'} alt={`Preview for ${p.title} in ${p.lang}`} className="w-full h-auto" />

          {p.videoUrl ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300" onClick={(e) => { e.stopPropagation(); setVideoOpen(true) }} aria-label="Play video">
              <PlayCircle className="h-12 w-12 text-white/90 drop-shadow-lg" />
            </div>
          ) : null}

          <div className="absolute top-3 right-3 flex flex-row gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
            {user && p.author_id === user.id && (
              <button className="h-10 w-10 rounded-full bg-white/0 hover:bg-white/0 z-20 flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 pointer-events-auto" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditOpen(true) }} aria-label="Edit pin">
                <Edit className="h-5 w-5 text-white" />
              </button>
            )}

            <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-white/0 hover:bg-white/0 z-20 cursor-pointer hover:scale-110 transition-all duration-200 pointer-events-auto" onClick={(e) => { e.stopPropagation(); handleLike() }} aria-label="Like">
              <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
            </Button>
            <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-white/0 hover:bg-white/0 z-20 cursor-pointer hover:scale-110 transition-all duration-200 pointer-events-auto" onClick={(e) => { e.stopPropagation(); handleShare() }} aria-label="Share">
              <Share2 className="h-5 w-5 text-white" />
            </Button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
            <Button size="icon" variant="secondary" className={`h-fit w-fit px-2 py-2 rounded-xl shadow-lg backdrop-blur-sm z-20 transition-all duration-200 cursor-pointer hover:scale-110 pointer-events-auto dark:bg-zinc-200 ${copied ? 'bg-green-500/90 hover:bg-green-500 text-white' : 'bg-card/90 hover:bg-card'}`} onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.code || ''); setCopied(true); toast.success('📋 Code Copied!', { description: `"${p.title}" code has been copied to clipboard`, duration: 3000 }); setTimeout(() => setCopied(false), 2000) }} aria-label={copied ? 'Copied!' : 'Copy code'}>
              {copied ? (
                <div className="flex items-center gap-1 dark:text-zinc-800"><Check className="h-4 w-4" /><span className="text-xs font-medium">Copied</span></div>
              ) : (
                <div className="flex items-center gap-2 dark:text-zinc-800"><Text className="h-4 w-4" /><span className="text-xs font-medium">Copy prompt</span></div>
              )}
            </Button>
          </div>
        </div>

        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
            <Button
            size="sm"
            className={`h-9 px-4 rounded-2xl shadow-lg font-medium flex-shrink-0 z-20 cursor-pointer hover:scale-105 transition-all duration-200 pointer-events-auto ${isInBoard ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : isSaved ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
            onClick={async (e) => {
              e.stopPropagation()
              if (isInBoard && onRemoveFromBoard) {
                onRemoveFromBoard()
                return
              }

					// Optimistic toggle using shared hook
					const wasSaved = isSaved
					if (wasSaved) removeFromSaved(p.id)
					else addToSaved(p.id)

              try {
                  const userFingerprint = typeof window !== 'undefined' ? (localStorage.getItem('nanographer_fingerprint') || '') : ''
                  const resp = await fetch(`/api/styles/${p.id}/save`, {
							method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ userFingerprint, userId: currentUserId || undefined }),
                  })

                  if (resp.ok) {
							const data = await resp.json().catch(() => ({} as any))
							const serverIsSaved = Boolean(data?.data?.is_saved)
							// Sync with server outcome if different
							if (serverIsSaved && !isstylesaved(p.id)) addToSaved(p.id)
							if (!serverIsSaved && isstylesaved(p.id)) removeFromSaved(p.id)
							toast.success(serverIsSaved ? '📌 Saved!' : '📌 Removed from saved', { description: `"${p.title}" ${serverIsSaved ? 'has been saved to' : 'has been removed from'} your collection`, duration: 3000 })
                  } else {
							// Revert on failure
							if (wasSaved) addToSaved(p.id)
							else removeFromSaved(p.id)
                    toast.error('Failed to save. Please try again.')
                }
              } catch (err) {
                console.error('Failed to toggle save:', err)
						// Revert on error
						if (wasSaved) addToSaved(p.id)
						else removeFromSaved(p.id)
                toast.error('Failed to save. Please try again.')
              }
            }}
            aria-label={isInBoard ? 'Remove' : isSaved ? 'Remove from saved' : 'Save'}
          >
            {isInBoard ? 'Remove' : isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </article>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium leading-snug text-card-foreground truncate flex-1" title={p.title}>{p.title}</h3>
        </div>
      </div>

  {/* board dialog removed - saves go directly to server */}
      {p.videoUrl ? <VideoLightbox open={videoOpen} onOpenChange={setVideoOpen} title={p.title} videoUrl={p.videoUrl} /> : null}
      <EditPinModal open={editOpen} onOpenChange={setEditOpen} pin={p} />
    </>
  )
}

