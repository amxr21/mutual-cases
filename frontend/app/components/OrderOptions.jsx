'use client'
import { useState } from "react"
import { OrderOption } from "."
import { useCart } from "../Context/CartContext"

/**
 * Order options (Task 4): "Make this a Gift" and "Leave a Note".
 *
 * - Gift: a simple toggle flag (no message field).
 * - Note: reveals an inline textarea for an order note.
 *
 * Both states live in the global cart's `requests`, which persists to
 * localStorage — so they survive navigation and flow through to checkout/order.
 */
function OrderOptions() {
    const { requests, setGift, setNote } = useCart()
    const [noteOpen, setNoteOpen] = useState(!!requests.note)

    const giftActive = requests.gift

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col xl:flex-row w-full gap-2 xl:gap-3">
                <OrderOption
                    icon="gift"
                    text="Make this a gift"
                    active={giftActive}
                    onClick={() => setGift(!giftActive)}
                />
                <OrderOption
                    icon="note"
                    text="Leave a note"
                    active={noteOpen || !!requests.note}
                    onClick={() => setNoteOpen((o) => !o)}
                />
            </div>

            {/* Order note — revealed when note is toggled open. */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                    noteOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <label className="flex flex-col gap-1.5 pt-1">
                    <span className="text-sm font-medium text-off-black">Your note</span>
                    <textarea
                        value={requests.note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="Anything we should know about this order?"
                        className="w-full bg-off-white border border-gray-300 rounded-md py-2 px-3 outline-none focus:border-blue transition-colors resize-none"
                    />
                </label>
            </div>
        </div>
    )
}

export default OrderOptions
