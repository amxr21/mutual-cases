'use client'
import Link from 'next/link'

/**
 * Shared empty-state / placeholder banner. One polished, bordered design reused
 * everywhere a list is empty, a guest must log in, or content is missing.
 *
 * @param {object} props
 * @param {'cart'|'heart'|'box'|'search'|'lock'|'alert'} [props.icon]
 * @param {string} props.title
 * @param {string} [props.message]
 * @param {{label:string, href?:string, onClick?:()=>void}} [props.action]
 * @param {{label:string, href?:string, onClick?:()=>void}} [props.secondaryAction]
 * @param {'sm'|'md'} [props.size]
 */
const ICONS = {
    cart: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z',
    heart: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z',
    box: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
    search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z',
    lock: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25Z',
    alert: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008Z',
}

function ActionButton({ action, primary }) {
    if (!action) return null
    const cls = primary
        ? 'bg-blue text-off-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98]'
        : 'border border-blue text-blue font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 hover:bg-blue/5 active:scale-[0.98]'
    if (action.href) {
        return <Link href={action.href} className={cls}>{action.label}</Link>
    }
    return (
        <button type="button" onClick={action.onClick} className={`${cls} cursor-pointer`}>
            {action.label}
        </button>
    )
}

export default function EmptyState({ icon = 'box', title, message, action, secondaryAction, size = 'md' }) {
    const pad = size === 'sm' ? 'p-6 xl:p-8' : 'p-8 xl:p-12'
    return (
        <div className={`w-full flex flex-col items-center text-center gap-4 ${pad} rounded-2xl border border-dashed border-blue/25 bg-off-white/60`}>
            <div className="w-16 h-16 rounded-full bg-blue/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="size-8 stroke-blue" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[icon] || ICONS.box} />
                </svg>
            </div>

            <div className="flex flex-col gap-1.5 max-w-md">
                <h3 className="text-xl xl:text-2xl font-semibold text-off-black">{title}</h3>
                {message ? <p className="font-light text-off-black/70">{message}</p> : null}
            </div>

            {(action || secondaryAction) ? (
                <div className="flex flex-col sm:flex-row gap-3 mt-1">
                    <ActionButton action={action} primary />
                    <ActionButton action={secondaryAction} />
                </div>
            ) : null}
        </div>
    )
}
