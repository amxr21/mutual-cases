import { InfoPage } from "@/app/components"

export const metadata = {
    title: "Mutual - Why Us?",
    description: "Why choose Mutual for your device covers.",
}

const REASONS = [
    { t: "Designed in the UAE", d: "Every cover is conceived locally, with editions inspired by the Emirates and made for life here." },
    { t: "Slim, light, optimal", d: "Protection that doesn't add bulk — engineered to stay true to your device's feel." },
    { t: "Made to last", d: "Premium materials and scratch- & fade-resistant prints that hold up to daily use." },
    { t: "Fast local delivery", d: "Next-day delivery across the UAE, with friendly support when you need it." },
    { t: "Truly yours", d: "Customize your own cover with Custom It — your style, your design, your cover." },
]

export default function WhyUs() {
    return (
        <InfoPage title="WHY US?" subtitle="More than just a case.">
            <p>
                Mutual was built on a simple idea: your device cover should be as considered as the
                device itself. Here&apos;s what sets us apart.
            </p>
            <ul className="flex flex-col gap-4 mt-2">
                {REASONS.map((r) => (
                    <li key={r.t} className="flex flex-col gap-1">
                        <span className="text-off-black font-semibold">{r.t}</span>
                        <span>{r.d}</span>
                    </li>
                ))}
            </ul>
        </InfoPage>
    )
}
