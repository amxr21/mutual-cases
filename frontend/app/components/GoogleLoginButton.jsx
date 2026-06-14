'use client'
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { publicConfig } from "../lib/config";
import { postJSON } from "../lib/safeFetch";
import { reportClientError } from "../lib/clientLogger";
import { useToast } from "./Toast/ToastProvider";

/**
 * Google Sign-In button + signed-in avatar.
 *
 * Hardened vs. original:
 *  - Guards window.google (the GSI script may not have loaded yet) and retries
 *    briefly instead of crashing on mount.
 *  - Auth request goes through safeFetch (timeout + consistent errors), no
 *    unguarded await.
 *  - Avatar only renders when a valid picture URL exists.
 */
export default function GoogleLoginButton() {
    const [user, setUser] = useState(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const [signInOpen, setSignInOpen] = useState(false)
    const menuRef = useRef(null)
    const toast = useToast()

    // Close the account menu on outside click.
    useEffect(() => {
        if (!menuOpen) return
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
        }
        document.addEventListener("mousedown", onClick)
        return () => document.removeEventListener("mousedown", onClick)
    }, [menuOpen])

    const handleLogout = () => {
        // Clear session + cart/like-related local state, then reload so all
        // global contexts re-hydrate to a signed-out state.
        ["token", "userName", "userPicture", "userId", "userRole", "mutual_cart_requests"].forEach((k) =>
            localStorage.removeItem(k)
        )
        toast.success("Signed out")
        setMenuOpen(false)
        setTimeout(() => {
            window.location.href = "/"
        }, 300)
    }

    // Restore an existing session on mount.
    useEffect(() => {
        const token = localStorage.getItem("token")
        const name = localStorage.getItem("userName")
        const picture = localStorage.getItem("userPicture")
        const userId = localStorage.getItem("userId")
        const role = localStorage.getItem("userRole") || "customer"
        if (token && name && picture && userId) {
            setUser({ name, picture, userId, role })
        }
    }, [])

    // Render Google's official button INTO the themed modal when it opens. The
    // modal trigger is our own on-brand button; Google's compliant button lives
    // inside so we still meet their branding requirements.
    useEffect(() => {
        if (user || !signInOpen) return
        let attempts = 0
        let timer

        const tryInit = () => {
            if (typeof window === "undefined") return
            if (window.google?.accounts?.id) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: publicConfig.googleClientId,
                        callback: handleCredentialResponse,
                    })
                    const el = document.getElementById("googleSignIn")
                    if (el) {
                        el.innerHTML = ""
                        window.google.accounts.id.renderButton(el, {
                            theme: "outline",
                            size: "large",
                            width: 280,
                        })
                    }
                } catch (err) {
                    reportClientError({
                        source: "google-signin",
                        message: `GSI init failed: ${err?.message}`,
                        stack: err?.stack,
                        component: "GoogleLoginButton",
                    })
                }
                return
            }
            if (attempts++ < 25) timer = setTimeout(tryInit, 200)
        }

        tryInit()
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signInOpen, user])

    const handleCredentialResponse = async (response) => {
        const result = await postJSON("/api/auth", { id_token: response?.credential })

        if (!result.ok || !result.data?.success) {
            reportClientError({
                source: "google-signin",
                message: `Auth failed: ${result.error?.message || "unknown"}`,
                component: "GoogleLoginButton",
            })
            toast.error("Sign-in failed. Please try again.")
            return
        }

        const data = result.data
        localStorage.setItem("token", data.token)
        localStorage.setItem("userName", data.name)
        localStorage.setItem("userPicture", data.picture ?? "")
        localStorage.setItem("userId", data.userId)
        localStorage.setItem("userRole", data.role ?? "customer")

        setUser({ name: data.name, picture: data.picture, userId: data.userId, role: data.role })
        toast.success(`Welcome${data.name ? `, ${String(data.name).split(' ')[0]}` : ''}!`)
        setSignInOpen(false)
    }

    const hasPicture = typeof user?.picture === "string" && user.picture.trim().length > 0
    const firstName = user?.name ? String(user.name).split(" ")[0] : "Account"

    return user ? (
        <div className="relative md:mx-4" ref={menuRef}>
            <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 cursor-pointer group"
            >
                <div className="relative min-w-10 w-10 min-h-10 h-10 overflow-hidden rounded-2xl bg-gray-200 ring-2 ring-transparent group-hover:ring-blue/30 transition-all">
                    {hasPicture ? (
                        <Image fill src={user.picture} alt="profile" className="object-cover" />
                    ) : (
                        <span className="flex items-center justify-center w-full h-full text-blue font-semibold">
                            {firstName.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <svg viewBox="0 0 24 24" fill="none" className={`size-4 stroke-off-black transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {/* Account dropdown */}
            <div
                role="menu"
                className={`absolute right-0 mt-2 w-52 bg-off-white rounded-xl shadow-xl border border-black/5 overflow-hidden z-[100000] origin-top-right transition-all duration-200 ${
                    menuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                }`}
            >
                <div className="px-4 py-3 border-b border-black/5">
                    <p className="text-sm font-light text-off-black/60">Signed in as</p>
                    <p className="font-semibold truncate">{user.name}</p>
                </div>
                <nav className="flex flex-col py-1 text-sm">
                    {user.role === "admin" ? (
                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="px-4 py-2 font-semibold text-blue hover:bg-blue/5 transition-colors">⚡ Dashboard</Link>
                    ) : null}
                    <Link href="/my-orders" onClick={() => setMenuOpen(false)} className="px-4 py-2 hover:bg-blue/5 transition-colors">My orders</Link>
                    <Link href="/liked" onClick={() => setMenuOpen(false)} className="px-4 py-2 hover:bg-blue/5 transition-colors">Liked items</Link>
                    <Link href="/cart" onClick={() => setMenuOpen(false)} className="px-4 py-2 hover:bg-blue/5 transition-colors">My cart</Link>
                    <Link href="/track-order" onClick={() => setMenuOpen(false)} className="px-4 py-2 hover:bg-blue/5 transition-colors">Track an order</Link>
                </nav>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 border-t border-black/5 text-blue font-semibold hover:bg-blue/5 transition-colors"
                >
                    Sign out
                </button>
            </div>
        </div>
    ) : (
        <>
            {/* On-brand trigger */}
            <button
                type="button"
                onClick={() => setSignInOpen(true)}
                className="flex items-center gap-2 bg-blue text-off-white font-semibold text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:brightness-110 active:scale-95 cursor-pointer whitespace-nowrap"
            >
                <svg viewBox="0 0 24 24" fill="none" className="size-4 stroke-current" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Sign in
            </button>

            {/* Themed sign-in modal */}
            <div
                className={`fixed inset-0 z-[1000001] flex items-center justify-center p-4 transition-all duration-300 ${
                    signInOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-off-black/40 backdrop-blur-sm"
                    onClick={() => setSignInOpen(false)}
                />
                {/* Dialog */}
                <div
                    role="dialog"
                    aria-modal="true"
                    className={`relative bg-off-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-5 text-center transition-all duration-300 ${
                        signInOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-2"
                    }`}
                >
                    <button
                        type="button"
                        onClick={() => setSignInOpen(false)}
                        aria-label="Close"
                        className="absolute top-3 right-3 text-off-black/40 hover:text-off-black transition-colors"
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-current" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <h2 className="text-2xl font-semibold text-blue">Welcome to Mutual</h2>
                    <p className="font-light text-off-black/70 -mt-2">
                        Sign in to save your cart, liked items, and track orders.
                    </p>

                    {/* Google's official button renders here */}
                    <div id="googleSignIn" className="flex justify-center min-h-[44px]" />

                    <p className="text-xs text-off-black/40">
                        We only use your Google account to identify you. We never post on your behalf.
                    </p>
                </div>
            </div>
        </>
    )
}
