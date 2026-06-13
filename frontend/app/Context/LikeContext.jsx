'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getJSON, postJSON, deleteJSON } from '../lib/safeFetch'
import { useToast } from '../components/Toast/ToastProvider'

/**
 * Global wishlist state. Holds the set of liked product ids so the nav badge and
 * every product card's heart stay in sync, and exposes a single toggleLike()
 * that talks to the backend with optimistic UI + themed toasts.
 */
const LikeContext = createContext(null)

export function LikeProvider({ children }) {
    const toast = useToast()
    const [likedIds, setLikedIds] = useState(() => new Set())
    const [userId, setUserId] = useState(null)
    const [hydrated, setHydrated] = useState(false)

    // Read the logged-in user id once on mount and hydrate liked ids from the API.
    useEffect(() => {
        const id = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        setUserId(id)
        if (!id) {
            setHydrated(true)
            return
        }
        let active = true
        ;(async () => {
            const result = await getJSON(`/liked/ids/${id}`)
            if (!active) return
            if (result.ok && Array.isArray(result.data)) {
                setLikedIds(new Set(result.data.map(Number)))
            }
            setHydrated(true)
        })()
        return () => {
            active = false
        }
    }, [])

    const isLiked = useCallback((productId) => likedIds.has(Number(productId)), [likedIds])

    const toggleLike = useCallback(
        async (productId) => {
            const pid = Number(productId)
            if (!pid) return

            const currentUserId = userId || localStorage.getItem('userId')
            if (!currentUserId) {
                toast.info('Please log in to save items to your liked list')
                return
            }

            const wasLiked = likedIds.has(pid)

            // Optimistic update.
            setLikedIds((prev) => {
                const next = new Set(prev)
                if (wasLiked) next.delete(pid)
                else next.add(pid)
                return next
            })

            const result = wasLiked
                ? await deleteJSON('/liked', { user_id: currentUserId, product_id: pid })
                : await postJSON('/liked', { user_id: currentUserId, product_id: pid })

            if (!result.ok) {
                // Roll back on failure.
                setLikedIds((prev) => {
                    const next = new Set(prev)
                    if (wasLiked) next.add(pid)
                    else next.delete(pid)
                    return next
                })
                toast.error(result.error?.message || "Couldn't update your liked list")
                return
            }

            toast.success(wasLiked ? 'Removed from liked' : 'Saved to your liked list')
        },
        [likedIds, userId, toast]
    )

    const value = useMemo(
        () => ({ likedIds, isLiked, toggleLike, likedCount: likedIds.size, hydrated }),
        [likedIds, isLiked, toggleLike, hydrated]
    )

    return <LikeContext.Provider value={value}>{children}</LikeContext.Provider>
}

export function useLike() {
    const ctx = useContext(LikeContext)
    if (ctx) return ctx
    // Safe fallback outside provider.
    return {
        likedIds: new Set(),
        isLiked: () => false,
        toggleLike: () => {},
        likedCount: 0,
        hydrated: false,
    }
}

export default LikeContext
