"use client"

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/analytics'

export function usePageAnalytics() {
  const pathname = usePathname()
  const startTime = useRef<number>(Date.now())
  const maxScrollDepth = useRef<number>(0)

  useEffect(() => {
    // Track page view
    analytics.pageView(pathname)
    
    // Track page load time
    const loadTime = Date.now() - startTime.current
    analytics.pageLoad(pathname, loadTime)

    // Track scroll depth
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollDepth = Math.round((scrollTop / docHeight) * 100)
      
      if (scrollDepth > maxScrollDepth.current) {
        maxScrollDepth.current = scrollDepth
        analytics.scrollDepth(pathname, scrollDepth)
      }
    }

    // Track time on page
    const handleBeforeUnload = () => {
      const timeSpent = Date.now() - startTime.current
      analytics.timeOnPage(pathname, timeSpent)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname])
}

export function useAnalytics() {
  return analytics
}
