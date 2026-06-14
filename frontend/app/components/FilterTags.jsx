'use client'
import { makeToken, useFilters } from '../Context/FilterContext'

/**
 * Tag/pill multiselect for a filter dimension (used for Model, which has many
 * values). Clicking a tag toggles it on/off, like a Notion multiselect. Selected
 * tags fill with brand blue; unselected are outlined.
 */
const cap = (s) => String(s ?? '').replace(/\b\w/g, (c) => c.toUpperCase())

export default function FilterTags({ dimension, options }) {
    const { isSelected, toggle } = useFilters()

    if (!options || options.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt, indx) => {
                const token = makeToken(dimension, opt.value)
                const active = isSelected(token)
                return (
                    <button
                        key={`${token}-${indx}`}
                        type="button"
                        onClick={() => toggle(token)}
                        aria-pressed={active}
                        className={`px-3 py-1 rounded-full text-sm font-light border transition-all duration-200 active:scale-95 cursor-pointer
                            ${active
                                ? 'bg-blue text-off-white border-blue shadow-sm'
                                : 'bg-off-white text-off-black border-gray-300 hover:border-blue hover:text-blue'
                            }`}
                    >
                        {cap(opt.value)}
                        {opt.count != null ? <span className={`ml-1 ${active ? 'text-off-white/70' : 'text-off-black/40'}`}>{opt.count}</span> : null}
                    </button>
                )
            })}
        </div>
    )
}
