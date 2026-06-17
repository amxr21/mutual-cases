'use client'
import { useEffect, useRef, useState } from 'react'
import { getJSON, postJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'

/**
 * Admin image upload. When Cloudinary is configured server-side, shows a square
 * preview + "Upload" button that signs the request (/admin/uploads/sign) and
 * POSTs the file directly to Cloudinary, returning the secure_url via onChange.
 * When NOT configured, falls back to a plain URL input so the feature still
 * works (paste a hosted image link).
 *
 * @param {string} value      current image URL
 * @param {(url:string)=>void} onChange
 * @param {string} folder     optional Cloudinary folder
 */
export default function ImageUpload({ value = '', onChange, folder }) {
    const toast = useToast()
    const inputRef = useRef(null)
    const [configured, setConfigured] = useState(null) // null=unknown, bool once checked
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState('')

    useEffect(() => {
        let active = true
        ;(async () => {
            const r = await getJSON('/admin/uploads/config')
            if (active) setConfigured(r.ok ? !!r.data?.configured : false)
        })()
        return () => { active = false }
    }, [])

    const pick = () => inputRef.current?.click()

    const onFile = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = '' // allow re-selecting the same file later
        if (!file) return
        if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return }

        setErr('')
        setBusy(true)
        // 1) get a signature from our API.
        const sign = await postJSON('/admin/uploads/sign', folder ? { folder } : {})
        if (!sign.ok || !sign.data?.configured) {
            setBusy(false)
            setErr('Image uploads are not configured on the server.')
            return
        }
        const { cloudName, apiKey, timestamp, signature, folder: signedFolder, uploadUrl } = sign.data

        // 2) upload the file straight to Cloudinary.
        try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('api_key', apiKey)
            fd.append('timestamp', timestamp)
            fd.append('signature', signature)
            fd.append('folder', signedFolder)
            const res = await fetch(uploadUrl || `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: fd,
            })
            const data = await res.json()
            if (!res.ok || !data.secure_url) {
                const msg = data?.error?.message || 'Upload failed'
                // Surface common misconfigurations clearly.
                if (/cloud_name/i.test(msg)) {
                    throw new Error(`Cloudinary rejected the cloud name "${cloudName}". Check CLOUDINARY_CLOUD_NAME in the backend .env (use the lowercase cloud name from your Cloudinary dashboard).`)
                }
                if (/signature|api_key/i.test(msg)) {
                    throw new Error(`Cloudinary auth failed (${msg}). Check CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.`)
                }
                throw new Error(msg)
            }
            onChange(data.secure_url)
            toast.success('Image uploaded')
        } catch (e) {
            setErr(e.message || 'Upload failed')
            toast.error('Upload failed')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0" style={{ background: 'var(--ui-surface-2)', border: '1px solid var(--ui-border)' }}>
                {value ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={value} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                    <span className="ui-muted text-xs">No image</span>
                )}
            </div>

            <div className="grow flex flex-col gap-2">
                {configured ? (
                    <>
                        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                        <div className="flex items-center gap-2">
                            <button type="button" className="ui-btn ui-btn-ghost" onClick={pick} disabled={busy}>
                                {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
                            </button>
                            {value ? (
                                <button type="button" className="ui-btn ui-btn-danger !px-3" onClick={() => onChange('')} disabled={busy}>Remove</button>
                            ) : null}
                        </div>
                        <span className="ui-muted text-xs">PNG, JPG or SVG. Stored on Cloudinary.</span>
                        {err ? (
                            <span className="text-xs rounded-md px-2 py-1.5" style={{ background: 'color-mix(in srgb, var(--ui-danger) 12%, transparent)', color: 'var(--ui-danger)' }}>{err}</span>
                        ) : null}
                    </>
                ) : (
                    <label className="flex flex-col gap-1.5 text-sm">
                        <input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="ui-input"
                            placeholder="https://…/logo.png"
                        />
                        {configured === null ? (
                            <span className="ui-muted text-xs">Checking upload service…</span>
                        ) : (
                            <span className="text-xs rounded-md px-2 py-1.5" style={{ background: 'color-mix(in srgb, var(--ui-accent) 14%, transparent)', color: 'var(--ui-text)' }}>
                                File upload is off — set <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code> and <code>CLOUDINARY_API_SECRET</code> in the backend <code>.env</code> and restart to enable drag-and-drop uploads. For now, paste a hosted image URL.
                            </span>
                        )}
                    </label>
                )}
            </div>
        </div>
    )
}
