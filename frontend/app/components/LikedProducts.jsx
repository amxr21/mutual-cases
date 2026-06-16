'use client'
import { useEffect, useState } from 'react'
import { Product, AddToCart, EmptyState } from '.'
import { getJSON } from '../lib/safeFetch'
import { useLike } from '../Context/LikeContext'

/**
 * Renders the signed-in user's liked products. Re-fetches when the liked set
 * changes (so unliking from this page removes the card). Friendly states for
 * logged-out / empty / error.
 */
function LikedProducts() {
    const { likedIds } = useLike()
    const [items, setItems] = useState([])
    const [status, setStatus] = useState('loading') // loading | ready | empty | guest | error

    useEffect(() => {
        let active = true
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

        if (!userId) {
            setStatus('guest')
            return
        }

        ;(async () => {
            const result = await getJSON(`/liked/${userId}`)
            if (!active) return
            if (result.ok && Array.isArray(result.data)) {
                setItems(result.data)
                setStatus(result.data.length ? 'ready' : 'empty')
            } else {
                setStatus('error')
            }
        })()

        return () => {
            active = false
        }
        // Re-run when the liked set size changes (like/unlike elsewhere).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [likedIds.size])

    // Keep the visible grid in sync with the liked set (instant unlike feedback).
    const visible = items.filter((it) => likedIds.has(Number(it.product_id ?? it.id)))

    if (status === 'loading') return <p className="font-light">Loading your liked items…</p>

    if (status === 'guest') {
        return (
            <EmptyState
                icon="heart"
                title="Log in to start saving the cases you love"
                message="Your liked items are saved to your account so you can find them anytime."
                action={{ label: 'Go to homepage', href: '/' }}
            />
        )
    }

    if (status === 'error') {
        return (
            <EmptyState
                icon="alert"
                title="We couldn't load your liked items"
                message="Something went wrong. Please refresh the page to try again."
            />
        )
    }

    if (visible.length === 0) {
        return (
            <EmptyState
                icon="heart"
                title="You haven't liked anything yet"
                message="Tap the heart on any product to save it here."
                action={{ label: 'Browse cases', href: '/products' }}
            />
        )
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-x-6 gap-y-16 xl:gap-y-10">
            {visible.map((p, indx) => {
                // Normalize so Product/AddToCart get an `id` field (liked rows expose product_id).
                const normalized = { ...p, id: p.product_id ?? p.id }
                return (
                    <div key={normalized.id ?? indx} className="flex flex-col gap-3">
                        <Product details={normalized} />
                        <AddToCart id={normalized.id} />
                    </div>
                )
            })}
        </div>
    )
}

export default LikedProducts
