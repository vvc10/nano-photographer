import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'

export function useSavedstyles() {
	const [savedPinIds, setSavedPinIds] = useState<Set<string>>(new Set())
	const [loading, setLoading] = useState(false)
	const { user } = useAuth()
	const bcRef = useRef<BroadcastChannel | null>(null)
	const instanceIdRef = useRef<string>('inst_' + Math.random().toString(36).slice(2) + Date.now().toString(36))

	function getFingerprint(): string | undefined {
		if (typeof window === 'undefined') return undefined
		const stored = localStorage.getItem('nanographer_fingerprint')
		if (stored) return stored
		const fp = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
		localStorage.setItem('nanographer_fingerprint', fp)
		return fp
	}

	async function fetchSavedFromApi(): Promise<string[]> {
		const url = new URL('/api/styles/saved', typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
		if (user?.id) {
			url.searchParams.set('userId', user.id)
		} else {
			const fp = getFingerprint()
			if (fp) url.searchParams.set('fingerprint', fp)
		}
		const response = await fetch(url.toString())
		if (!response.ok) return []
		const data = await response.json().catch(() => ({ data: [] }))
		const list = data?.data ?? data?.items ?? []
		return (list as any[]).map((pin: any) => pin.id)
	}

	// Broadcast setup for realtime syncing across tabs
	useEffect(() => {
		if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return
		const bc = new BroadcastChannel('nanographer:saved-styles')
		bcRef.current = bc
		const onMessage = (evt: MessageEvent) => {
			const msg = evt.data as { type: 'save' | 'unsave'; id: string; source: string }
			if (!msg || !msg.id || msg.source === instanceIdRef.current) return
			setSavedPinIds(prev => {
				const next = new Set(prev)
				if (msg.type === 'save') next.add(msg.id)
				else next.delete(msg.id)
				return next
			})
		}
		bc.addEventListener('message', onMessage as any)
		return () => {
			bc.removeEventListener('message', onMessage as any)
			bc.close()
			bcRef.current = null
		}
	}, [])

	function broadcast(type: 'save' | 'unsave', id: string) {
		try {
			bcRef.current?.postMessage({ type, id, source: instanceIdRef.current })
		} catch (e) {
			// ignore
		}
	}

	// Fetch all saved pin IDs for the current user
	const fetchSavedstyles = useCallback(async () => {
		if (!user && typeof window === 'undefined') {
			setSavedPinIds(new Set())
			return
		}

		setLoading(true)
		try {
			const ids = await fetchSavedFromApi()
			setSavedPinIds(new Set(ids))
		} catch (error) {
			console.error('❌ Error fetching saved styles:', error)
		} finally {
			setLoading(false)
		}
	}, [user?.id])

	// Check if a specific pin is saved
	const isstylesaved = useCallback((pinId: string) => {
		return savedPinIds.has(pinId)
	}, [savedPinIds])

	// Add a pin to saved styles (optimistic update)
	const addToSaved = useCallback((pinId: string) => {
		setSavedPinIds(prev => new Set([...prev, pinId]))
		broadcast('save', pinId)
	}, [])

	// Remove a pin from saved styles (optimistic update)
	const removeFromSaved = useCallback((pinId: string) => {
		setSavedPinIds(prev => {
			const newSet = new Set(prev)
			newSet.delete(pinId)
			return newSet
		})
		broadcast('unsave', pinId)
	}, [])

	// Load saved styles when user changes
	useEffect(() => {
		setLoading(true)
		const run = async () => {
			try {
				const ids = await fetchSavedFromApi()
				setSavedPinIds(new Set(ids))
			} catch (error) {
				console.error('❌ Error fetching saved styles:', error)
			} finally {
				setLoading(false)
			}
		}
		run()
	}, [user?.id])

	return {
		savedPinIds,
		isstylesaved,
		addToSaved,
		removeFromSaved,
		loading,
		refetch: fetchSavedstyles
	}
}
