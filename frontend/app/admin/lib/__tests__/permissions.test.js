import { describe, test, expect } from "vitest"
import { can, canManageStaff, canManageOwners, isFullAccess, PERMISSIONS } from "../permissions"

/**
 * The client permissions mirror must stay in lockstep with the backend's
 * (backend/middleware/permissions.js). These tests pin the role model:
 * owner + developer are full access; only owner governs owner/developer
 * accounts; manager/fulfillment/support are scoped.
 */
describe("client permissions mirror", () => {
    test("owner and developer have full access", () => {
        expect(PERMISSIONS.owner).toEqual(["*"])
        expect(PERMISSIONS.developer).toEqual(["*"])
        expect(can("settings", "owner")).toBe(true)
        expect(can("settings", "developer")).toBe(true)
        expect(isFullAccess("owner")).toBe(true)
        expect(isFullAccess("developer")).toBe(true)
    })

    test("manager is scoped (no staff area)", () => {
        expect(can("orders", "manager")).toBe(true)
        expect(can("staff", "manager")).toBe(false)
        expect(isFullAccess("manager")).toBe(false)
    })

    test("support and fulfillment are narrowly scoped", () => {
        expect(can("reviews", "support")).toBe(true)
        expect(can("settings", "support")).toBe(false)
        expect(can("inventory", "fulfillment")).toBe(true)
        expect(can("discounts", "fulfillment")).toBe(false)
    })

    test("only owner may manage owner/developer accounts (governance rail)", () => {
        expect(canManageOwners("owner")).toBe(true)
        expect(canManageOwners("developer")).toBe(false)
        expect(canManageOwners("manager")).toBe(false)
    })

    test("owner and developer may manage staff generally", () => {
        expect(canManageStaff("owner")).toBe(true)
        expect(canManageStaff("developer")).toBe(true)
        expect(canManageStaff("manager")).toBe(false)
    })

    test("an unknown/null role grants nothing (safe default)", () => {
        expect(can("orders", null)).toBe(false)
        expect(canManageStaff(null)).toBe(false)
        expect(isFullAccess(null)).toBe(false)
    })
})
