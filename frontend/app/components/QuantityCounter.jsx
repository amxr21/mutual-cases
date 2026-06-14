'use client'

/**
 * Reusable – / + quantity control. Controlled component: parent owns the value
 * and handles changes (so it can sync to the global cart). Smoothly animates on
 * press. `min` defaults to 0 so it can also act as a remove-at-zero control.
 */
export default function QuantityCounter({ value, onChange, min = 0, max = 99, size = 'md', disabled = false }) {
    const dec = () => !disabled && onChange(Math.max(min, Number(value) - 1))
    const inc = () => !disabled && onChange(Math.min(max, Number(value) + 1))

    const dims = size === 'lg' ? 'h-11' : size === 'sm' ? 'h-8' : 'h-10'
    const btn = size === 'lg' ? 'w-11 text-2xl' : size === 'sm' ? 'w-8 text-lg' : 'w-10 text-xl'

    return (
        <div className={`inline-flex items-center ${dims} rounded-lg border border-gray-300 bg-off-white overflow-hidden select-none`}>
            <button
                type="button"
                onClick={dec}
                disabled={disabled || Number(value) <= min}
                aria-label="Decrease quantity"
                className={`${btn} h-full flex items-center justify-center text-off-black hover:bg-blue hover:text-off-white transition-colors duration-200 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-off-black cursor-pointer`}
            >
                –
            </button>
            <span className="min-w-8 text-center font-semibold text-off-black tabular-nums">{value}</span>
            <button
                type="button"
                onClick={inc}
                disabled={disabled || Number(value) >= max}
                aria-label="Increase quantity"
                className={`${btn} h-full flex items-center justify-center text-off-black hover:bg-blue hover:text-off-white transition-colors duration-200 active:scale-90 disabled:opacity-30 cursor-pointer`}
            >
                +
            </button>
        </div>
    )
}
