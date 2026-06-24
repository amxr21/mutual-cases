import { InfoPage } from "@/app/components"

export const metadata = {
    title: "Mutual - Privacy Policy",
    description: "How Mutual collects, uses, and protects your information.",
}

const SECTIONS = [
    {
        t: "Information we collect",
        d: "When you sign in with Google or place an order, we collect your name, email, profile picture, and order details. We do not collect payment card data directly — payments are handled by our payment providers.",
    },
    {
        t: "How we use your information",
        d: "We use your information to process orders, provide support, operate your account and wishlist, and improve our products and service. We do not sell your personal data.",
    },
    {
        t: "Cookies & local storage",
        d: "We use browser storage to keep you signed in and to remember your cart and liked items. You can clear these at any time from your browser.",
    },
    {
        t: "Data security",
        d: "We apply reasonable technical and organizational measures to protect your information. No method of transmission over the internet is 100% secure, but we work to keep your data safe.",
    },
    {
        t: "Contact",
        d: "For any privacy questions or requests, contact us at support@mutualcovers.ae.",
    },
]

export default function PrivacyPolicy() {
    return (
        <InfoPage title="PRIVACY POLICY" subtitle="Your data, handled with care.">
            <p className="text-sm text-off-black/60">Last updated: 2026</p>
            {SECTIONS.map((s) => (
                <div key={s.t} className="flex flex-col gap-1.5">
                    <h2 className="text-off-black font-semibold text-lg">{s.t}</h2>
                    <p>{s.d}</p>
                </div>
            ))}
        </InfoPage>
    )
}
