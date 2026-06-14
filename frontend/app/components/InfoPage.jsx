/**
 * Reusable content page layout for static/info pages (privacy, terms, why-us,
 * order journey, etc.). Renders the brand blue hero + an overlapping white card
 * holding the page content. Matches the about/custom-it visual language.
 */
export default function InfoPage({ title, subtitle, children }) {
    return (
        <main className="pb-16">
            <section className="banner relative -mx-8 xl:-mx-20 px-8 xl:px-20 pt-16 pb-28 xl:pt-20 xl:pb-36 overflow-hidden text-center">
                <div className="absolute inset-0 bg-blue/85" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <h1 className="text-3xl xl:text-5xl font-semibold text-off-white tracking-wide">{title}</h1>
                    {subtitle ? (
                        <p className="text-lg xl:text-xl font-light text-off-white/90">{subtitle}</p>
                    ) : null}
                </div>
            </section>

            <section className="mx-auto max-w-4xl">
                <div className="bg-off-white rounded-2xl shadow-xl p-6 xl:p-10 -mt-20 xl:-mt-28 relative z-10 flex flex-col gap-5 text-off-black/85 font-light leading-relaxed">
                    {children}
                </div>
            </section>
        </main>
    )
}
