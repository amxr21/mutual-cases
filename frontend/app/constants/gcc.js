/**
 * GCC countries and their major cities, used to make the checkout address form's
 * Country -> City selection a proper dependent relationship (picking a country
 * filters the city options). 'Other' lets a customer type a city not listed.
 *
 * Shared so admin (delivery coverage) and storefront (checkout) stay consistent.
 */
export const GCC_CITIES = {
    'United Arab Emirates': [
        'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain',
        'Ras Al Khaimah', 'Fujairah', 'Al Ain',
    ],
    'Saudi Arabia': [
        'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran', 'Tabuk',
    ],
    'Qatar': ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Lusail'],
    'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Al Ahmadi', 'Al Jahra'],
    'Bahrain': ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town'],
    'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur'],
}

export const GCC_COUNTRIES = Object.keys(GCC_CITIES)

/** City options for a country, always ending with an "Other" escape hatch. */
export const citiesFor = (country) => {
    const list = GCC_CITIES[country] || []
    return [...list, 'Other']
}
