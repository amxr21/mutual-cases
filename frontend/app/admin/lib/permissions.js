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
    // developer = full operational + technical access; the only thing reserved
    // for owners is managing owner/developer accounts (see canManageOwners).
    developer: ['*'],
    manager: ['orders', 'products', 'inventory', 'delivery', 'returns', 'reviews', 'customers', 'discounts', 'settings', 'reports'],
    fulfillment: ['orders', 'delivery', 'inventory', 'returns'],
    support: ['reviews', 'customers', 'returns', 'orders'],
}

// Roles with full, owner-equivalent capability.
const FULL_ACCESS_ROLES = new Set(['owner', 'developer'])

export function getStaffRole() {
    if (typeof window === 'undefined') return null
    try { return localStorage.getItem('staffRole') || null } catch { return null }
}

/** Does the given (or current) staff role hold a permission area? */
export function can(area, role = getStaffRole()) {
    const perms = PERMISSIONS[role] || []
    return perms.includes('*') || perms.includes(area)
}

/**
 * May this role manage staff at all (add members, change lower roles)? Owner and
 * developer both can. NOTE: this only gates the Staff section's general controls;
 * creating/demoting OWNER or DEVELOPER accounts is further restricted to owners
 * via canManageOwners — and the API enforces both regardless.
 */
export function canManageStaff(role = getStaffRole()) {
    return FULL_ACCESS_ROLES.has(role)
}

/** Only an owner may create or demote owner/developer accounts. */
export function canManageOwners(role = getStaffRole()) {
    return role === 'owner'
}

/** Is this a full-access (owner-equivalent) role? */
export function isFullAccess(role = getStaffRole()) {
    return FULL_ACCESS_ROLES.has(role)
}
