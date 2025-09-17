"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MasonryPinterest } from "@/components/masonry-pinterest"
import { MasonrySkeleton } from "@/components/skeletons/masonry-skeleton"
import type { Pin } from "../types/pin"
import { StylesCard } from "@/components/pin/styles-card"
import { FiltersBar } from "@/components/filters-bar"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { DiscoveryOrb } from "@/components/ai/discovery-orb"
import { AppLayout } from "@/components/layout/app-layout"
import { AuthGuard } from "@/components/auth/auth-guard"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return v
}

const PAGE_SIZE = 18

function HomePageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)

  const [q, setQ] = useState("")
  const [lang, setLang] = useState<string>("all")
  const [tags, setTags] = useState<string[]>([])
  const [type, setType] = useState<string>("all")

  useEffect(() => {
    setMounted(true)
    // Initialize state from search params after mounting
    setQ(searchParams.get("q") ?? "")
    setLang(searchParams.get("lang") ?? "all")
    const t = searchParams.get("tags")
    const list = t ? t.split(",").filter(Boolean) : []
    setTags(list.length > 0 ? [list[0]] : [])
    setType(searchParams.get("type") ?? "all")
  }, [searchParams])

  useEffect(() => {
    const pin = searchParams.get("pin")
    if (pin) {
      router.replace(`/styles/${encodeURIComponent(pin)}`)
    }
  }, [router, searchParams])

  const toggleTag = (t: string) => setTags((prev) => (prev.length === 1 && prev[0] === t ? [] : [t]))
  const clearFilters = () => {
    setLang("all")
    setTags([])
    setQ("")
    setType("all")
  }

  const getKey = (index: number) => {
    const cursor = index * PAGE_SIZE
    const params = new URLSearchParams({
      cursor: String(cursor),
      limit: String(PAGE_SIZE),
    })
    if (q) params.set("q", q)
    if (lang && lang !== "all") params.set("lang", lang)
    if (tags.length) params.set("tags", tags[0])
    if (type && type !== 'all') params.set("type", type)
    return `/api/styles?${params.toString()}`
  }

  const { data, error, isValidating, size, setSize, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
  })

  useEffect(() => {
    setSize(1)
    mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, lang, tags.join(","), type])

  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (lang && lang !== "all") params.set("lang", lang)
    if (tags.length) params.set("tags", tags[0])
    if (type && type !== 'all') params.set("type", type)
    const qs = params.toString()
    const href = qs ? `${pathname}?${qs}` : pathname
    router.replace(href)
  }, [q, lang, tags.join(","), type, pathname, router])

  useEffect(() => {
    const urlQ = searchParams.get("q") ?? ""
    const urlLang = searchParams.get("lang") ?? "all"
    const urlTags = (searchParams.get("tags") ?? "").split(",").filter(Boolean)
    if (urlQ !== q) setQ(urlQ)
    if (urlLang !== lang) setLang(urlLang)
    const firstOnly = urlTags.length > 0 ? [urlTags[0]] : []
    if (firstOnly.join(",") !== tags.join(",")) setTags(firstOnly)
    const urlType = searchParams.get("type") ?? "all"
    if (urlType !== type) setType(urlType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Normalize URL if multiple tags provided
  useEffect(() => {
    const raw = searchParams.get("tags") ?? ""
    if (raw.includes(",")) {
      const first = raw.split(",").filter(Boolean)[0]
      const params = new URLSearchParams(searchParams.toString())
      if (first) params.set("tags", first); else params.delete("tags")
      router.replace(`${pathname}?${params.toString()}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const items: Pin[] = useMemo(() => (data ? data.flatMap((p: any) => (p?.data ?? []) as Pin[]) : []), [data])
  const hasMore = useMemo(() => Boolean(data && data[data.length - 1]?.data && (data[data.length - 1].data.length >= PAGE_SIZE)), [data])

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!hasMore) return
    const node = loadMoreRef.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting) {
        setSize((s) => s + 1)
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, setSize, loadMoreRef])

  const isInitialLoading = !data && !error

  if (!mounted) {
    return (
      <AppLayout currentTab="home">
        <div className="min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-balance">Discover styles</h1>
          </div>
          <div className="mb-5 overflow-hidden">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <MasonrySkeleton />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout currentTab="home">
      <div>
        <div className="min-w-0" data-content-area>
    
          <div className="mb-5 overflow-hidden">
            <FiltersBar
              lang={lang}
              onLangChange={setLang}
              tags={tags}
              onToggleTag={toggleTag}
              onClear={clearFilters}
              type={type}
              onTypeChange={setType}
            />
          </div>

          {error && <p className="text-sm text-destructive">Failed to load styles. Please try again.</p>}

          {isInitialLoading ? (
            <MasonrySkeleton items={12} />
          ) : (
            <MasonryPinterest 
              items={items} 
              renderItem={(pin) => <StylesCard pin={pin} />} 
              className="mt-2" 
              gap={16}
              columns={{
                mobile: 1,
                tablet: 2,
                desktop: 3,
                xl: 4
              }}
            />
          )}

          <div ref={loadMoreRef} className="h-8" aria-hidden />

          <div className="flex items-center justify-center py-6">
            {isValidating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                Loading more styles...
              </div>
            )}
            {!hasMore && !isValidating && <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>}
          </div>
        </div>
      </div>

      {/* Floating AI Discovery orb uses current q/lang/tags to suggest styles (mock) */}
      <DiscoveryOrb q={q} lang={lang} tags={tags} type={type} />
    </AppLayout>
  )
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomePageContent />
    </AuthGuard>
  )
}
