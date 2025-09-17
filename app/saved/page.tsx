"use client"

import useSWR from 'swr'
import { AppLayout } from '@/components/layout/app-layout'
import { MasonryPinterest } from '@/components/masonry-pinterest'
import { MasonrySkeleton } from '@/components/skeletons/masonry-skeleton'
import { useState, useEffect, useMemo } from 'react'
import { StylesCard } from '@/components/pin/styles-card'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function SavedPage() {
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), [])

	const savedUrl = useMemo(() => {
		if (!mounted) return null as string | null
		const url = new URL('/api/styles/saved', typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
		try {
			const raw = localStorage.getItem('auth:user')
			const userId = raw ? (JSON.parse(raw)?.id as string | undefined) : undefined
			if (userId) {
				url.searchParams.set('userId', userId)
			} else {
				const fp = typeof window !== 'undefined' ? (localStorage.getItem('nanographer_fingerprint') || '') : ''
				if (fp) url.searchParams.set('fingerprint', fp)
			}
		} catch {}
		return url.toString()
	}, [mounted])

	const { data, error, mutate } = useSWR(savedUrl, fetcher)

	// Revalidate on cross-tab save/unsave
	useEffect(() => {
		if (!mounted || typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return
		const bc = new BroadcastChannel('nanographer:saved-styles')
		const onMessage = () => {
			mutate()
		}
		bc.addEventListener('message', onMessage as any)
		return () => {
			bc.removeEventListener('message', onMessage as any)
			bc.close()
		}
	}, [mounted, mutate])

	const styles = data?.data || []
	const isLoading = !data && !error
	const isEmpty = !isLoading && Array.isArray(styles) && styles.length === 0

	return (
		<AppLayout currentTab="saved">
			<div>
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-balance">Saved Styles</h1>
				</div>

				{isLoading ? (
					<MasonrySkeleton items={12} />
				) : isEmpty ? (
					<div className="text-sm text-muted-foreground">No saved styles yet. Start saving your favorites to see them here.</div>
				) : (
					<MasonryPinterest
						items={styles}
						renderItem={(s: any) => (
							<StylesCard pin={s} />
						)}
						columns={{ mobile: 1, tablet: 2, desktop: 3, xl: 4 }}
					/>
				)}
			</div>
		</AppLayout>
	)
}
