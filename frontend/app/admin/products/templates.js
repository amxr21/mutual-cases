/**
 * Product detail templates — auto-fill description/material/approach/features
 * based on a product's type + category. Mirrors backend/scripts/
 * backfillProductDetails.js so admin-created products read like seeded ones.
 * Admins can use a template as a starting point, then edit any field freely.
 */
const MATERIAL_BY_TYPE = {
    normal: 'Impact-resistant polycarbonate with a soft-touch matte finish',
    '3d design': 'Layered resin over polycarbonate with a raised 3D textured print',
    simple: 'Slim flexible TPU with an anti-fingerprint coating',
    light: 'Ultra-light aramid-fiber composite, barely-there feel',
    magnet: 'Polycarbonate shell with built-in MagSafe-compatible magnet array',
}

const APPROACH_BY_CATEGORY = {
    iphone: 'Precision-molded to the exact iPhone chassis, with raised camera and screen lips for drop protection and tactile, clicky button covers.',
    ipad: 'Engineered for iPad with a fold-to-stand cover, precise port cutouts, and reinforced corners to absorb everyday knocks.',
    'special items': 'A limited, handcrafted-feel piece designed around a seasonal theme — produced in small batches with extra attention to finish.',
}

const FEATURES_BASE = [
    'Raised edges protect screen & camera',
    'Slim, pocket-friendly profile',
    'Wireless-charging compatible',
    'Scratch- & fade-resistant print',
]

const EXTRA_FEATURE_BY_TYPE = {
    magnet: 'Snaps securely to MagSafe chargers & mounts',
    light: 'Among the lightest cases we make',
    '3d design': 'Tactile 3D artwork you can feel',
    simple: 'Minimal bulk, maximum grip',
    normal: 'All-day everyday durability',
}

const cap = (s) => String(s || '').replace(/\b\w/g, (c) => c.toUpperCase())

/**
 * Build the 4 detail fields from a product's type/category/edition.
 * Returns { description, material, approach, features }.
 */
export function buildTemplate({ type, category, edition, model }) {
    const t = String(type || 'normal').toLowerCase()
    const cat = String(category || 'iphone').toLowerCase()
    const catLabel = cat === 'iphone' ? 'iPhone' : cat === 'ipad' ? 'iPad' : 'Mutual'
    const noun = cat === 'special items' ? 'piece' : 'case'
    const ed = cap(edition) || cap(model) || ''

    const description = `The ${ed ? ed + ' ' : ''}${catLabel} ${noun} blends ${t} styling with everyday durability. Designed in the UAE, it pairs a clean look with reliable, slim protection for your device.`
    const material = MATERIAL_BY_TYPE[t] || MATERIAL_BY_TYPE.normal
    const approach = APPROACH_BY_CATEGORY[cat] || APPROACH_BY_CATEGORY.iphone
    const features = [...FEATURES_BASE, EXTRA_FEATURE_BY_TYPE[t]].filter(Boolean).join(' | ')

    return { description, material, approach, features }
}
