/**
 * UI string dictionaries for the bilingual storefront (English + Arabic).
 * Keys are dot-namespaced by area. Dynamic DB content (product names, etc.)
 * is shown as-entered and is not translated here.
 *
 * Add a key to BOTH `en` and `ar`. Missing keys fall back to the key itself.
 */
export const en = {
    // Nav
    'nav.home': 'Home',
    'nav.products': 'Cases & More',
    'nav.customIt': 'Custom It',
    'nav.about': 'About Us',
    'nav.cart': 'Cart',
    'nav.liked': 'Liked',
    'nav.signIn': 'Sign in',
    'nav.signOut': 'Sign out',
    'nav.myOrders': 'My orders',
    'nav.trackOrder': 'Track an order',
    'nav.dashboard': 'Dashboard',

    // Common
    'common.add': 'Add To Cart',
    'common.checkout': 'Checkout',
    'common.total': 'Total',
    'common.subtotal': 'Subtotal',
    'common.continue': 'Continue shopping',
    'common.loading': 'Loading…',
    'common.search': 'Search…',
    'common.apply': 'Apply',
    'common.remove': 'Remove',
    'common.aed': 'AED',
    'common.outOfStock': 'Out of stock',
    'common.notifyMe': 'Notify me',

    // Products
    'products.title': 'Products',
    'products.empty': 'No products match your filters.',
    'products.filters': 'Filters',
    'products.sort': 'Sort',
    'products.reviews': 'Reviews',
    'products.noReviews': 'No reviews yet — be the first to review this product after purchase.',
    'products.verified': 'Verified purchase',

    // Cart
    'cart.title': 'Your Cart',
    'cart.inCart': 'In cart',
    'cart.empty': 'Your cart is empty.',
    'cart.gift': 'Gift wrapping',
    'cart.note': 'Note',

    // Checkout
    'checkout.shipping': 'Shipping Address',
    'checkout.country': 'Country',
    'checkout.city': 'City',
    'checkout.area': 'Area',
    'checkout.street': 'Street / Building',
    'checkout.payment': 'Payment',
    'checkout.cod': 'Cash on Delivery',
    'checkout.cardOnDelivery': 'Card on Delivery',
    'checkout.summary': 'Order Summary',
    'checkout.placeOrder': 'Place Order',
    'checkout.discountCode': 'Discount code',
    'checkout.useLocation': 'Use my location',

    // Orders
    'orders.title': 'My Orders',
    'orders.current': 'Current',
    'orders.previous': 'Previous',
    'orders.track': 'Track',
    'orders.trackThis': 'Track this order',
    'orders.requestReturn': 'Request a return',
    'orders.yourDelivery': 'Your delivery',
    'orders.status': 'Status',
    'orders.inDelivery': 'Orders on the way',
    'orders.findOrder': 'Find your order',
    'orders.orderNumberPlaceholder': 'Order number (e.g. MTL-XXXX-1234)',

    // Custom-it
    'custom.submit': 'Submit Order',
    'custom.success': 'Request submitted!',
}

export const ar = {
    // Nav
    'nav.home': 'الرئيسية',
    'nav.products': 'الأغطية والمزيد',
    'nav.customIt': 'صمّمه',
    'nav.about': 'من نحن',
    'nav.cart': 'السلة',
    'nav.liked': 'المفضلة',
    'nav.signIn': 'تسجيل الدخول',
    'nav.signOut': 'تسجيل الخروج',
    'nav.myOrders': 'طلباتي',
    'nav.trackOrder': 'تتبّع الطلب',
    'nav.dashboard': 'لوحة التحكم',

    // Common
    'common.add': 'أضف إلى السلة',
    'common.checkout': 'الدفع',
    'common.total': 'الإجمالي',
    'common.subtotal': 'المجموع الفرعي',
    'common.continue': 'متابعة التسوق',
    'common.loading': 'جارٍ التحميل…',
    'common.search': 'بحث…',
    'common.apply': 'تطبيق',
    'common.remove': 'إزالة',
    'common.aed': 'درهم',
    'common.outOfStock': 'غير متوفر',
    'common.notifyMe': 'أعلمني',

    // Products
    'products.title': 'المنتجات',
    'products.empty': 'لا توجد منتجات تطابق عوامل التصفية.',
    'products.filters': 'تصفية',
    'products.sort': 'ترتيب',
    'products.reviews': 'التقييمات',
    'products.noReviews': 'لا توجد تقييمات بعد — كن أول من يقيّم هذا المنتج بعد الشراء.',
    'products.verified': 'عملية شراء موثّقة',

    // Cart
    'cart.title': 'سلتك',
    'cart.inCart': 'في السلة',
    'cart.empty': 'سلتك فارغة.',
    'cart.gift': 'تغليف الهدايا',
    'cart.note': 'ملاحظة',

    // Checkout
    'checkout.shipping': 'عنوان الشحن',
    'checkout.country': 'الدولة',
    'checkout.city': 'المدينة',
    'checkout.area': 'المنطقة',
    'checkout.street': 'الشارع / المبنى',
    'checkout.payment': 'الدفع',
    'checkout.cod': 'الدفع عند الاستلام',
    'checkout.cardOnDelivery': 'بطاقة عند الاستلام',
    'checkout.summary': 'ملخص الطلب',
    'checkout.placeOrder': 'إتمام الطلب',
    'checkout.discountCode': 'رمز الخصم',
    'checkout.useLocation': 'استخدم موقعي',

    // Orders
    'orders.title': 'طلباتي',
    'orders.current': 'الحالية',
    'orders.previous': 'السابقة',
    'orders.track': 'تتبّع',
    'orders.trackThis': 'تتبّع هذا الطلب',
    'orders.requestReturn': 'طلب إرجاع',
    'orders.yourDelivery': 'توصيلك',
    'orders.status': 'الحالة',
    'orders.inDelivery': 'طلبات قيد التوصيل',
    'orders.findOrder': 'ابحث عن طلبك',
    'orders.orderNumberPlaceholder': 'رقم الطلب (مثال: MTL-XXXX-1234)',

    // Custom-it
    'custom.submit': 'إرسال الطلب',
    'custom.success': 'تم إرسال الطلب!',
}

export const DICTS = { en, ar }
