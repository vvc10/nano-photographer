"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageCircle, X, FileText, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Pin } from "@/types/pin"
import { SubmissionModal } from "@/components/submission/submission-modal"
import { useAnalytics } from "@/hooks/use-analytics"

type Props = {
  q: string
  lang: string
  tags: string[]
  type?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DiscoveryOrb({ q, lang, tags, type = "all" }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const analytics = useAnalytics()
  const [items, setItems] = useState<Pin[]>([])
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)

  const params = useMemo(() => {
    const p = new URLSearchParams()
    p.set("cursor", "0")
    p.set("limit", "30")
    if (q) p.set("q", q)
    if (lang && lang !== "all") p.set("lang", lang)
    if (tags.length) p.set("tags", tags.join(","))
    if (type && type !== 'all') p.set("type", type)
    return p.toString()
  }, [q, lang, tags, type])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/styles?${params}`)
  const json = await res.json()
  const list: Pin[] = (json?.data as Pin[]) || []
      // lightweight random subset up to 6
      const shuffled = [...list].sort(() => Math.random() - 0.5)
      setItems(shuffled.slice(0, 6))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, params])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open submission options"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-ring transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Submission options"
          className="fixed bottom-20 right-5 z-40 w-[min(92vw,360px)] rounded-2xl border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <p className="text-sm font-medium">Want to submit your prompt?</p>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close options">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-3">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Share your creativity with the community or suggest new features!
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  analytics.openSubmissionModal()
                  setShowSubmissionModal(true)
                }}
                className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-primary/5 dark:hover:text-zinc-200 hover:text-zinc-800 transition-colors duration-200 border-0 bg-transparent hover:shadow-sm"
                variant="ghost"
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium text-sm">Submit Prompt</div>
                  <div className="text-xs text-muted-foreground truncate">Share your best AI prompts</div>
                </div>
              </Button>

              <Button
                onClick={() => {
                  analytics.openSubmissionModal()
                  setShowSubmissionModal(true)
                }}
                className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-primary/5 dark:hover:text-zinc-200 hover:text-zinc-800 transition-colors duration-200 border-0 bg-transparent hover:shadow-sm"
                variant="ghost"
              >
                <Lightbulb className="h-5 w-5 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium text-sm">Feature Suggestion</div>
                  <div className="text-xs text-muted-foreground truncate">Help us improve the platform</div>
                </div>
              </Button>
            </div>

            <div className="pt-3 border-t">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="w-full hover:bg-muted/50 hover:text-foreground transition-colors duration-200"
              >
                Maybe later
              </Button>
            </div>
          </div>
        </div>
      )}

      <SubmissionModal 
        open={showSubmissionModal} 
        onOpenChange={setShowSubmissionModal} 
      />
    </>
  )
}
