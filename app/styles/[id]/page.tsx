"use client"

import { useEffect, useState, use } from "react"
import { Button } from "@/components/ui/button"
import { ApplyStyleModal } from "@/components/upload/apply-style-modal"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Heart, Bookmark, ArrowLeft, MoreHorizontal, Share2 } from "lucide-react"
import { useCallback } from "react"
import { toast } from "sonner"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark"
import { AppLayout } from "@/components/layout/app-layout"
import { CreditsBadge } from "@/components/ui/credits-badge"
import { useSavedstyles } from "@/hooks/use-saved-styles"

export default function StyleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [style, setStyle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(false)
  const { isstylesaved, addToSaved, removeFromSaved } = useSavedstyles()

  
  const [likeCount, setLikeCount] = useState(0)
  const [saveCount, setSaveCount] = useState(0)
  const [resolvedId, setResolvedId] = useState<string | null>(null)
  const [userFingerprint] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nanographer_fingerprint')
      if (stored) return stored
      const fp = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('nanographer_fingerprint', fp)
      return fp
    }
    return 'server_placeholder'
  })
  const [applyOpen, setApplyOpen] = useState(false)
  const handleShare = useCallback(async () => {
    try {
      const url = `${window.location.origin}/styles/${id}`
      const shareData: ShareData = { title: style?.name || 'Style', text: style?.name || 'Style', url }
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('🔗 Link copied!', { description: 'Style URL copied to clipboard', duration: 2500 })
      }
    } catch (e) {
      const url = `${window.location.origin}/styles/${id}`
      await navigator.clipboard.writeText(url)
      toast.success('🔗 Link copied!', { description: 'Style URL copied to clipboard', duration: 2500 })
    }
  }, [id, style?.name])

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const fp = typeof window !== 'undefined' ? (localStorage.getItem('nanographer_fingerprint') || '') : ''
        const url = new URL(`/api/styles`, window.location.origin)
        if (fp) url.searchParams.set('fingerprint', fp)
        const res = await fetch(url.toString())
        const json = await res.json()
        if (!ignore) {
          const found = (json.data || []).find((s: any) => s.id === id || s.slug === id)
          setStyle(found || null)
          if (found) {
            setResolvedId(found.id)
            setLiked(Boolean(found._is_liked))
            // Saved state comes from the shared hook; no local state needed
            setLikeCount(Number(found._like_count || 0))
            setSaveCount(Number(found._save_count || 0))
          }
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [id])

  const handleLike = useCallback(async () => {
    if (!resolvedId) return
    const prev = liked
    const prevCount = likeCount
    setLiked(!prev)
    setLikeCount((c) => (prev ? Math.max(0, c - 1) : c + 1))
    try {
      const res = await fetch(`/api/styles/${resolvedId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userFingerprint })
      })
      if (!res.ok) throw new Error('like failed')
      const json = await res.json()
      setLiked(Boolean(json.data.is_liked))
      setLikeCount(Number(json.data.like_count || 0))
    } catch (e) {
      setLiked(prev)
      setLikeCount(prevCount)
      toast.error('Failed to like')
    }
  }, [resolvedId, liked, likeCount, userFingerprint])

  const handleSave = useCallback(async () => {
    const targetId = resolvedId || id
    const wasSaved = isstylesaved(targetId)
    const prevCount = saveCount
    if (wasSaved) {
      removeFromSaved(targetId)
      setSaveCount((c) => Math.max(0, c - 1))
    } else {
      addToSaved(targetId)
      setSaveCount((c) => c + 1)
    }
    try {
      const res = await fetch(`/api/styles/${targetId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userFingerprint })
      })
      if (!res.ok) throw new Error('save failed')
      const json = await res.json()
      // keep hook state; only adjust count from server if provided
      setSaveCount(Number(json.data.save_count || prevCount))
    } catch (e) {
      // revert optimistic on error
      if (wasSaved) {
        addToSaved(targetId)
        setSaveCount(prevCount)
      } else {
        removeFromSaved(targetId)
        setSaveCount(prevCount)
      }
      toast.error('Failed to save')
    }
  }, [id, resolvedId, isstylesaved, addToSaved, removeFromSaved, saveCount, userFingerprint])

  if (loading) {
    return (
      <AppLayout currentTab="home">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-muted rounded mb-4"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!style) {
    return (
      <AppLayout currentTab="home">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Style not found</h1>
            <p className="text-muted-foreground">The style you're looking for doesn't exist.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const imageUrl = style.cover_image_url || "/placeholder.svg"

  return (
    <AppLayout currentTab="home">
      <main className="min-h-screen bg-background">
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Flex Layout - Left Preview (60%) & Right Sidebar (40%) */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-12">
            {/* Left Side - Preview */}
            <div className="lg:w-[60%] flex flex-col gap-4 border border-border rounded-2xl p-6">
              <div className="flex flex-row justify-between items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.history.back()}
                    className="p-2 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 rounded-xl cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <span>Style</span>
                  <span>•</span>
                  <span className="font-medium text-foreground">{style.name}</span>
                </div>
                
                {/* Action Buttons - Top Right */}
                <div className="z-10 flex items-center gap-2">
                  {/* More Options Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>

                  {/* Like Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer ${liked ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800' : ''}`}
                    onClick={handleLike}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{likeCount}</span>
                  </Button>
                  {/* Share Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  
                  {/* Save Button */}
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className={`flex items-center gap-2 rounded-xl shadow-lg transition-all duration-200 ${isstylesaved(id)
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      } cursor-pointer`}
                  >
                    <Bookmark className={`w-4 h-4 ${isstylesaved(id) ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">
                      {isstylesaved(resolvedId || id) ? 'Saved' : 'Save'}
                    </span>
                  </Button>
                </div>
              </div>

              <div className="sticky top-20 lg:top-24">
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden relative">
                  <img
                    src={imageUrl}
                    alt={style.name}
                    className="w-full h-auto"
                    style={{
                      maxHeight: "80vh",
                      objectFit: "contain",
                      display: "block"
                    }}
                  />
                </div>
              </div>

              {/* Title and Category Info - Below Image */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="text-xl font-normal text-foreground leading-tight">{style.name}</h4>
                  {style.category && (
                    <Badge variant="secondary" className="text-xs">
                      {style.category}
                    </Badge>
                  )}
                </div>
                {style.credits && (
                  <div className="flex items-center">
                    <CreditsBadge credits={style.credits} />
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Prompt Sidebar */}
            <div className="lg:w-[40%] h-fit flex flex-col gap-4 border border-border rounded-2xl p-6 lg:min-w-0 lg:max-w-[40%]">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" onClick={() => setApplyOpen(true)}>
                        Apply to My Photo
                      </Button>
              <div className="sticky top-20 lg:top-24">
                <div className="rounded-2xl bg-muted/50 ring-1 ring-border overflow-hidden shadow-sm w-full h-[500px] flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground font-medium">Prompt</span>
                      {/* <Badge variant="secondary" className="text-xs">
                        {(style.prompt?.length || 0)} characters
                      </Badge> */}
                    </div>
                    <div className="flex items-center gap-2">
                    
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`transition-all duration-200 cursor-pointer hover:scale-105 rounded-xl px-3 py-1 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 ${copied
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                          : 'text-muted-foreground'
                        }`}
                        onClick={async () => {
                          const text = (style.prompt && String(style.prompt).trim().length > 0)
                            ? String(style.prompt)
                            : 'no prompt available stay tuned.'
                          await navigator.clipboard.writeText(text)
                          setCopied(true)
                          setTimeout(() => {
                            setCopied(false)
                          }, 2000)
                        }}
                      >
                        {copied ? (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
                    <SyntaxHighlighter
                      language="text"
                      wrapLongLines={true}
                      style={{
                        ...oneDark,
                        'pre[class*="language-"]': {
                          ...oneDark['pre[class*="language-"]'],
                          background: 'transparent !important',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                        },
                        'code[class*="language-"]': {
                          ...oneDark['code[class*="language-"]'],
                          background: 'transparent !important',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                        }
                      }}
                      customStyle={{
                        margin: 0,
                        background: "transparent !important",
                        padding: "1rem",
                        fontSize: "0.85rem",
                        lineHeight: 1.6,
                        height: "100%",
                        overflowY: "auto",
                        overflowX: "hidden",
                        width: "100%",
                        maxWidth: "100%",
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(156, 163, 175, 0.3) transparent"
                      }}
                      codeTagProps={{
                        style: {
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                        }
                      }}
                      className="[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/50 [&>pre]:!bg-transparent [&>pre>code]:!bg-transparent"
                      showLineNumbers={true}
                      wrapLines={true}
                    >
                      {style.prompt || 'No prompt available'}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <ApplyStyleModal open={applyOpen} onOpenChange={setApplyOpen} preselectedStyle={style} />
    </AppLayout>
  )
}