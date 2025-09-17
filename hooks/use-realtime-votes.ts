"use client"

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface VoteUpdate {
  pinId: string
  count: number
  isLiked: boolean
  userId?: string
  fingerprint?: string
  action: 'like' | 'unlike'
}

function getFingerprint(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const stored = localStorage.getItem('nanographer_fingerprint')
  if (stored) return stored
  const fp = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
  localStorage.setItem('nanographer_fingerprint', fp)
  return fp
}

export function useRealtimeVotes(pinId: string) {
  const [voteCount, setVoteCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    // Skip if supabase is not available (build time)
    if (!supabase) {
      return
    }

    const initIdentity = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      const fp = getFingerprint() || null
      setFingerprint(fp)
      return { userId: user?.id || null, fp }
    }

    // Fetch initial vote data
    const fetchInitialData = async () => {
      try {
        const { userId, fp } = await initIdentity()
        const url = new URL(`/api/votes`, window.location.origin)
        url.searchParams.set('pinId', pinId)
        if (userId) url.searchParams.set('userId', userId)
        else if (fp) url.searchParams.set('fingerprint', fp)
        const response = await fetch(url.toString())
        const data = await response.json()
        if (data.count !== undefined) setVoteCount(data.count)
        if (data.isLiked !== undefined) setIsLiked(data.isLiked)
      } catch (error) {
        setVoteCount(0)
        setIsLiked(false)
      }
    }

    fetchInitialData()

    // Create a channel for this specific pin
    const voteChannel = supabase
      .channel(`votes:${pinId}`, {
        config: { broadcast: { self: true } }
      })
      .on('broadcast', { event: 'vote_update' }, (payload: any) => {
        const { pinId: updatedPinId, count, isLiked: updatedIsLiked, userId, fingerprint: fromFp, action } = payload.payload as VoteUpdate
        if (updatedPinId !== pinId) return
        setVoteCount(count)
        // Update isLiked only if the action is from the same identity
        const sameUser = userId && currentUserId && userId === currentUserId
        const sameFp = fromFp && fingerprint && fromFp === fingerprint
        if (sameUser || (!currentUserId && sameFp)) {
          setIsLiked(updatedIsLiked)
        }
      })
      .subscribe((status: any) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    setChannel(voteChannel)

    return () => {
      voteChannel.unsubscribe()
    }
  }, [pinId, currentUserId, fingerprint])

  // Function to broadcast vote updates
  const broadcastVote = async (count: number, liked: boolean, action: 'like' | 'unlike') => {
    if (!channel) return
    const voteUpdate: VoteUpdate = {
      pinId,
      count,
      isLiked: liked,
      action,
    }
    if (currentUserId) voteUpdate.userId = currentUserId
    else if (fingerprint) voteUpdate.fingerprint = fingerprint
    try {
      await channel.send({ type: 'broadcast', event: 'vote_update', payload: voteUpdate })
    } catch {}
  }

  return { voteCount, isLiked, isConnected, currentUserId, broadcastVote, fingerprint }
}
