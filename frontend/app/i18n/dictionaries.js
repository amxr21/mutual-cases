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
    'products.reviewCount': 'reviews',
    'products.mutualReplied': 'Mutual replied',
    'products.notifyEmail': 'Email me when available',
    'products.onTheList': "You're on the list — we'll email you when it's back.",
    'common.saving': 'Saving…',

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

    // Home — Hero
    'home.heroLabel': 'Slim. Strong. Yours',
    'home.heroTitle': 'More than just a Cover',
    'home.heroTagline': 'Crafted for iPads, iPhones, and pens — built for your lifestyle.',

    // Home — About
    'home.aboutHeader': 'About Mutual',
    'home.aboutP1a': 'A cover brand for the next generation of thinkers,',
    'home.aboutP1creators': 'creators',
    'home.aboutP1and': 'and',
    'home.aboutP1doers': 'doers.',
    'home.aboutP1b': "Whether you're hustling between classes, sketching at a café, or grinding out ideas at midnight — our covers are designed to move with you.",
    'home.aboutP2a': 'Born as the',
    'home.aboutP2brand': 'first Emirati brand',
    'home.aboutP2b': 'specializing in iPad covers, we craft premium designs featuring unique phrases and exclusive features — from Apple Pencil charging support to built-in stands for your workflow.',
    'home.aboutP3a': 'Our mission is simple: Protect what matters.',
    'home.aboutP3style': 'Do it with style.',

    // Home — Features
    'home.featuresHeader': 'We offer three types of iPad cases',
    'home.featuresSub': 'Each has specific functions to match your needs!',
    'home.feat.magnet.0': 'Multiple positions',
    'home.feat.magnet.1': 'Detachable into 2 pieces',
    'home.feat.magnet.2': 'Hangable on metal surfaces',
    'home.feat.magnet.3': 'Supports pencil charging',
    'home.feat.magnet.4': 'Extra protection',
    'home.feat.simple.0': 'Combination of 3 pieces',
    'home.feat.simple.1': 'Stands in 3 basic positions',
    'home.feat.simple.2': 'Hangable on metal surfaces',
    'home.feat.simple.3': 'Supports pencil charging',
    'home.feat.simple.4': 'Very light weight',
    'home.feat.light.0': 'Stands in 3 basic positions',
    'home.feat.light.1': 'Supports pencil charging',
    'home.feat.light.2': 'Light weight',
    'home.feat.light.3': 'Perfect for simple, general use',
    'home.feat.name.magnet': 'magnet',
    'home.feat.name.simple': 'simple',
    'home.feat.name.light': 'light',

    // Home — Steps
    'home.stepsHeader': 'How We Make Your Order',
    'home.stepsSub': 'From concept to your doorstep — every cover goes through a thoughtful, hands-on process.',
    'home.step.0.h': 'Start with the Design',
    'home.step.0.p': "Whether it's a bold graphic, a clean minimal layout, or a city-inspired vibe — our process begins with fresh, on-trend designs tailored for your device. We're always creating, sketching, and curating to keep your cover style sharp.",
    'home.step.1.h': 'Apply with Precision',
    'home.step.1.p': 'Once you choose your favorite, we carefully apply the design to the right-fit cover using durable materials and scratch-resistant finishes. Each piece is aligned, sealed, and quality-checked by hand.',
    'home.step.2.h': 'Review & Verify',
    'home.step.2.p': "Before it leaves us, your item is inspected to ensure it's flawless. We double-check print quality, fit, and finish — no dust, no smudges, no slip-ups.",
    'home.step.3.h': 'Pack It, Ready to Go',
    'home.step.3.p': "Finally, we wrap it in clean, protective packaging that keeps it safe and looking fresh. It's then prepped for fast delivery, so it shows up ready to impress.",

    // Home — Unique
    'home.uniqueHeader': 'What Sets Us Apart',
    'home.uniqueSub': "We don't just sell covers — we create everyday essentials designed to move with you. Here's what makes Mutual different:",
    'home.unique.0.h': 'Youth-First Design',
    'home.unique.0.p': 'Everything we make starts with real needs — slim profiles, clean looks, and bold colors built for daily use. No fluff. Just function.',
    'home.unique.1.h': 'Fast. Friendly. Always Ready.',
    'home.unique.1.p': 'From browsing to checkout to delivery, we keep it smooth, quick, and easy. No hassle, just hustle.',
    'home.unique.2.h': "Mutual Isn't Just a Name",
    'home.unique.2.p': "It's our mindset: balance, connection, and purpose. We design with you, for you — every step of the way.",

    // Home — Discover
    'home.discoverHeader': 'Our Products',
    'home.discoverSub': 'Flexible. Secure. Instantly ready. \n Designed to stand, fold, and flex around your workflow — wherever that takes you',

    // Footer
    'footer.brief': 'More than just a case. Slim, light, optimal, and for You!',
    'footer.about': 'About',
    'footer.quickLinks': 'Quick Links',
    'footer.contact': 'Contact',
    'footer.contactUs': 'Contact Us',
    'footer.contactBlurb': "Got a question or a custom request? We're here to help.",
    'footer.established': 'Established in 2024 - AD, UAE',
    'footer.link.about': 'What is Mutual?',
    'footer.link.journey': 'Order Journey',
    'footer.link.privacy': 'Privacy Policy',
    'footer.link.terms': 'Terms & Conditions',
    'footer.link.whyUs': 'Why Us?',
    'footer.link.ipad': 'iPad Cases',
    'footer.link.iphone': 'iPhone Cases',
    'footer.link.special': 'Special Items',
    'footer.link.customize': 'Customize It',
    'footer.link.whereOrder': "Where's my Order?",
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
    'products.reviewCount': 'تقييمات',
    'products.mutualReplied': 'ردّت Mutual',
    'products.notifyEmail': 'راسلني عند التوفّر',
    'products.onTheList': 'أنت على القائمة — سنراسلك عند عودته للتوفّر.',
    'common.saving': 'جارٍ الحفظ…',

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

    // Home — Hero
    'home.heroLabel': 'أنيق. متين. لك',
    'home.heroTitle': 'أكثر من مجرّد غطاء',
    'home.heroTagline': 'مصمَّم لأجهزة آيباد وآيفون والأقلام — مصنوع لأسلوب حياتك.',

    // Home — About
    'home.aboutHeader': 'عن Mutual',
    'home.aboutP1a': 'علامة أغطية للجيل القادم من المفكّرين',
    'home.aboutP1creators': 'والمبدعين',
    'home.aboutP1and': 'و',
    'home.aboutP1doers': 'صنّاع الإنجاز.',
    'home.aboutP1b': 'سواء كنت تتنقّل بين المحاضرات، أو ترسم في مقهى، أو تطوّر أفكارك في منتصف الليل — أغطيتنا مصمَّمة لترافقك أينما ذهبت.',
    'home.aboutP2a': 'وُلدنا بصفتنا',
    'home.aboutP2brand': 'أول علامة إماراتية',
    'home.aboutP2b': 'متخصّصة في أغطية الآيباد، نصنع تصاميم راقية بعبارات فريدة ومزايا حصرية — من دعم شحن قلم Apple إلى حوامل مدمجة تناسب سير عملك.',
    'home.aboutP3a': 'مهمّتنا بسيطة: احمِ ما يهمّك.',
    'home.aboutP3style': 'وافعل ذلك بأناقة.',

    // Home — Features
    'home.featuresHeader': 'نقدّم ثلاثة أنواع من أغطية الآيباد',
    'home.featuresSub': 'لكلٍّ منها وظائف محدّدة تلبّي احتياجاتك!',
    'home.feat.magnet.0': 'أوضاع متعدّدة',
    'home.feat.magnet.1': 'قابل للفصل إلى قطعتين',
    'home.feat.magnet.2': 'قابل للتعليق على الأسطح المعدنية',
    'home.feat.magnet.3': 'يدعم شحن القلم',
    'home.feat.magnet.4': 'حماية إضافية',
    'home.feat.simple.0': 'تركيبة من ثلاث قطع',
    'home.feat.simple.1': 'يقف في ثلاثة أوضاع أساسية',
    'home.feat.simple.2': 'قابل للتعليق على الأسطح المعدنية',
    'home.feat.simple.3': 'يدعم شحن القلم',
    'home.feat.simple.4': 'خفيف الوزن جدًّا',
    'home.feat.light.0': 'يقف في ثلاثة أوضاع أساسية',
    'home.feat.light.1': 'يدعم شحن القلم',
    'home.feat.light.2': 'خفيف الوزن',
    'home.feat.light.3': 'مثالي للاستخدام العام البسيط',
    'home.feat.name.magnet': 'المغناطيسي',
    'home.feat.name.simple': 'البسيط',
    'home.feat.name.light': 'الخفيف',

    // Home — Steps
    'home.stepsHeader': 'كيف نصنع طلبك',
    'home.stepsSub': 'من الفكرة إلى باب منزلك — يمرّ كل غطاء بعملية مدروسة ويدويّة بعناية.',
    'home.step.0.h': 'نبدأ بالتصميم',
    'home.step.0.p': 'سواء كان رسمًا جريئًا، أو تصميمًا بسيطًا أنيقًا، أو طابعًا مستوحى من المدينة — تبدأ عمليتنا بتصاميم عصرية مبتكرة مصمّمة لجهازك. نبتكر ونرسم وننسّق باستمرار لإبقاء أسلوب غطائك متميّزًا.',
    'home.step.1.h': 'نطبّق بدقّة',
    'home.step.1.p': 'بمجرّد اختيارك للتصميم المفضّل، نطبّقه بعناية على الغطاء المناسب باستخدام مواد متينة وتشطيبات مقاومة للخدش. تُحاذى كل قطعة وتُختم وتُفحص جودتها يدويًّا.',
    'home.step.2.h': 'نراجع ونتحقّق',
    'home.step.2.p': 'قبل أن يغادر منتجك، يُفحص للتأكّد من خلوّه من العيوب. نتحقّق مرّتين من جودة الطباعة والمقاس والتشطيب — بلا غبار، ولا لطخات، ولا أخطاء.',
    'home.step.3.h': 'نغلّفه وجاهز للانطلاق',
    'home.step.3.p': 'أخيرًا، نغلّفه بعبوة نظيفة وواقية تحافظ على سلامته ومظهره الجديد. ثم يُجهَّز لتوصيل سريع ليصل جاهزًا ليُبهرك.',

    // Home — Unique
    'home.uniqueHeader': 'ما الذي يميّزنا',
    'home.uniqueSub': 'نحن لا نبيع الأغطية فحسب — بل نصنع أساسيات يومية مصمّمة لترافقك. إليك ما يجعل Mutual مختلفة:',
    'home.unique.0.h': 'تصميم يضع الشباب أولًا',
    'home.unique.0.p': 'كل ما نصنعه يبدأ من احتياجات حقيقية — تصاميم نحيفة، ومظهر أنيق، وألوان جريئة للاستخدام اليومي. بلا حشو. وظيفة خالصة.',
    'home.unique.1.h': 'سريع. ودود. جاهز دائمًا.',
    'home.unique.1.p': 'من التصفّح إلى الدفع إلى التوصيل، نُبقي الأمور سلسة وسريعة وسهلة. بلا متاعب، فقط إنجاز.',
    'home.unique.2.h': 'Mutual ليست مجرّد اسم',
    'home.unique.2.p': 'إنها عقليّتنا: التوازن والتواصل والهدف. نصمّم معك ولأجلك — في كل خطوة على الطريق.',

    // Home — Discover
    'home.discoverHeader': 'منتجاتنا',
    'home.discoverSub': 'مرن. آمن. جاهز فورًا. \n مصمَّم ليقف ويُطوى ويتكيّف مع سير عملك — أينما أخذك ذلك',

    // Footer
    'footer.brief': 'أكثر من مجرّد غطاء. نحيف، خفيف، مثالي، ولأجلك!',
    'footer.about': 'عن Mutual',
    'footer.quickLinks': 'روابط سريعة',
    'footer.contact': 'تواصل',
    'footer.contactUs': 'تواصل معنا',
    'footer.contactBlurb': 'لديك سؤال أو طلب مخصّص؟ نحن هنا للمساعدة.',
    'footer.established': 'تأسّست عام 2024 ميلادية، الإمارات',
    'footer.link.about': 'ما هي Mutual؟',
    'footer.link.journey': 'رحلة الطلب',
    'footer.link.privacy': 'سياسة الخصوصية',
    'footer.link.terms': 'الشروط والأحكام',
    'footer.link.whyUs': 'لماذا نحن؟',
    'footer.link.ipad': 'أغطية آيباد',
    'footer.link.iphone': 'أغطية آيفون',
    'footer.link.special': 'منتجات خاصّة',
    'footer.link.customize': 'صمّمه',
    'footer.link.whereOrder': 'أين طلبي؟',
}

export const DICTS = { en, ar }
