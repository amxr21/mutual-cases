import { describe, test, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

// Mock the data + toast dependencies before importing the component.
const getJSON = vi.fn()
vi.mock("../../lib/safeFetch", () => ({ getJSON: (...a) => getJSON(...a) }))
vi.mock("../Toast/ToastProvider", () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))

import PromoPopup from "../PromoPopup"

const FEATURED = [{ code: "WELCOME10", type: "percent", value: 10, min_spend: 0, expires_at: null }]

describe("PromoPopup weekly cooldown", () => {
    beforeEach(() => {
        localStorage.clear()
        getJSON.mockReset()
    })

    test("shows the offer on a fresh visit with featured codes", async () => {
        getJSON.mockResolvedValue({ ok: true, data: FEATURED })
        render(<PromoPopup />)
        expect(await screen.findByText("WELCOME10")).toBeInTheDocument()
    })

    test("does NOT show again within the 7-day cooldown", async () => {
        // Seen 1 day ago -> still inside the cooldown window.
        localStorage.setItem("mutual_promo_popup_seen", String(Date.now() - 24 * 60 * 60 * 1000))
        getJSON.mockResolvedValue({ ok: true, data: FEATURED })
        render(<PromoPopup />)
        // It should never fetch or render while suppressed.
        await new Promise((r) => setTimeout(r, 20))
        expect(getJSON).not.toHaveBeenCalled()
        expect(screen.queryByText("WELCOME10")).not.toBeInTheDocument()
    })

    test("shows again after the cooldown has elapsed (8 days ago)", async () => {
        localStorage.setItem("mutual_promo_popup_seen", String(Date.now() - 8 * 24 * 60 * 60 * 1000))
        getJSON.mockResolvedValue({ ok: true, data: FEATURED })
        render(<PromoPopup />)
        expect(await screen.findByText("WELCOME10")).toBeInTheDocument()
    })

    test("renders nothing when there are no featured codes", async () => {
        getJSON.mockResolvedValue({ ok: true, data: [] })
        const { container } = render(<PromoPopup />)
        await waitFor(() => expect(getJSON).toHaveBeenCalled())
        expect(container).toBeEmptyDOMElement()
    })

    test("marks itself seen after showing (sets the cooldown stamp)", async () => {
        getJSON.mockResolvedValue({ ok: true, data: FEATURED })
        render(<PromoPopup />)
        await screen.findByText("WELCOME10")
        expect(localStorage.getItem("mutual_promo_popup_seen")).toBeTruthy()
    })
})
