import { InfoPage } from "@/app/components"

export const metadata = {
    title: "Mutual - Terms & Conditions",
    description: "The terms that govern your use of Mutual.",
}

const SECTIONS = [
    {
        t: "Acceptance of terms",
        d: "By accessing this website and placing orders, you agree to these Terms & Conditions. If you do not agree, please do not use the service.",
    },
    {
        t: "Orders & pricing",
        d: "All prices are in AED and include VAT where applicable. We reserve the right to correct pricing errors and to cancel or refuse any order at our discretion.",
    },
    {
        t: "Custom orders",
        d: "Custom It requests are reviewed before production. We may contact you to confirm details, and reserve the right to decline designs that are unlawful or infringe third-party rights.",
    },
    {
        t: "Shipping & returns",
        d: "We aim for next-day UAE delivery. If an item arrives damaged or defective, contact us within a reasonable period and we'll make it right.",
    },
    {
        t: "Intellectual property",
        d: "All content, branding, and designs on this site are owned by Mutual and may not be reproduced without permission.",
    },
    {
        t: "Contact",
        d: "Questions about these terms? Reach us at support@mutualcovers.",
    },
]

export default function Terms() {
    return (
        <InfoPage title="TERMS & CONDITIONS" subtitle="The essentials.">
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
