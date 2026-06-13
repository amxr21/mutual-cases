import CustomItForm from "@/app/components/CustomItForm"

export const metadata = {
  title: "Mutual - Custom It",
  description: "Design your own custom cover — your style, your design, your cover.",
}

export default function CustomIt() {
  return (
    <main className="pb-16">
      {/* Hero */}
      <section className="banner relative -mx-8 xl:-mx-20 px-8 xl:px-20 pt-16 pb-28 xl:pt-20 xl:pb-36 overflow-hidden text-center">
        <div className="absolute inset-0 bg-blue/85" />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <h1 className="text-4xl xl:text-6xl font-semibold text-off-white tracking-wide">CUSTOM IT</h1>
          <p className="text-lg xl:text-2xl font-light text-off-white/90">
            Your style, your design, your cover
          </p>
        </div>
      </section>

      {/* Form card (overlaps the hero) */}
      <section className="px-0 xl:px-4">
        <CustomItForm />
      </section>
    </main>
  )
}
