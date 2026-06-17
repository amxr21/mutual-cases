'use client'
/**
 * Client-side mirror of backend/middleware/permissions.js. Used ONLY to hide
 * controls a staff member can't use — the API still enforces every write
 * server-side, so this is UX, not security.
 *
 * The current admin's staff_role is stashed in localStorage ('staffRole') by
 * AdminGuard after it loads the overview. Read it with getStaffRole().
 */
export const PERMISSIONS = {
    owner: ['*'],
    manager: ['orders', 'products', 'inventory', 'delivery', 'returns', 'reviews', 'customers', 'discounts', 'settings', 'reports'],
    fulfillment: ['orders', 'delivery', 'inventory', 'returns'],
    support: ['reviews', 'customers', 'returns', 'orders'],
}

export function getStaffRole() {
    if (typeof window === 'undefined') return 'owner'
    try { return localStorage.getItem('staffRole') || 'owner' } catch { return 'owner' }
}

/** Does the given (or current) staff role hold a permission area? */
export function can(area, role = getStaffRole()) {
    const perms = PERMISSIONS[role] || []
    return perms.includes('*') || perms.includes(area)
}

/** Only the owner manages staff/roles. */
export function canManageStaff(role = getStaffRole()) {
    return (role || 'owner') === 'owner'
}
