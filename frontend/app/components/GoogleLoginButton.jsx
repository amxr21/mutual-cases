'use client'
import Image from "next/image";
import { useEffect, useState } from "react";
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
    const toast = useToast()

    useEffect(() => {
        const token = localStorage.getItem("token")
        const name = localStorage.getItem("userName")
        const picture = localStorage.getItem("userPicture")
        const userId = localStorage.getItem("userId")

        if (token && name && picture && userId) {
            setUser({ name, picture, userId })
            return
        }

        // Initialize the Google button once the GSI script is available. The
        // external script loads async, so poll briefly rather than assuming it.
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
                        window.google.accounts.id.renderButton(el, {
                            theme: "outline",
                            size: "large",
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
            // Not ready yet — retry up to ~5s.
            if (attempts++ < 25) {
                timer = setTimeout(tryInit, 200)
            }
        }

        tryInit()
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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

        setUser({ name: data.name, picture: data.picture, userId: data.userId })
        toast.success(`Welcome${data.name ? `, ${String(data.name).split(' ')[0]}` : ''}!`)

        const googleButtonDiv = document.getElementById("googleSignIn")
        if (googleButtonDiv) googleButtonDiv.style.display = "none"
    }

    const hasPicture = typeof user?.picture === "string" && user.picture.trim().length > 0

    return user ? (
        <div className="grow top-0 left-0 flex items-center gap-4 xl:mx-4">
            <div className="relative min-w-10 w-10 min-h-10 h-10 overflow-hidden rounded-2xl bg-gray-200">
                {hasPicture ? (
                    <Image fill src={user.picture} alt="profile image" className="object-cover" />
                ) : null}
            </div>
        </div>
    ) : (
        <div id="googleSignIn"></div>
    )
}
