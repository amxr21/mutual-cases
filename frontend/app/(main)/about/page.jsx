import Image from "next/image"

import AboutImg1 from "../../../public/images/about/image 30.jpg"
import AboutImg2 from "../../../public/images/about/image 31.jpg"
import AboutImg3 from "../../../public/images/about/image 32.jpg"

export const metadata = {
  title: "Mutual - About Us",
  description: "Who is Mutual? From an idea to impact — a journey into entrepreneurship.",
}

export default function About() {
  return (
    <main className="pb-16">
      {/* Hero */}
      <section className="banner relative -mx-8 xl:-mx-20 px-8 xl:px-20 pt-16 pb-32 xl:pt-20 xl:pb-40 overflow-hidden text-center">
        <div className="absolute inset-0 bg-blue/85" />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <h1 className="text-4xl xl:text-6xl font-semibold text-off-white tracking-wide">ABOUT US</h1>
          <p className="text-lg xl:text-2xl font-light text-off-white/90">Who is Mutual?</p>
        </div>
      </section>

      {/* Overlapping story card */}
      <section className="mx-auto ">
        <div className="bg-off-white rounded-2xl shadow-xl p-6 xl:p-10 -mt-20 xl:-mt-28 relative z-0 grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-12 items-center">
          <h2 className="text-3xl xl:text-5xl font-bold leading-tight text-off-black">
            From An Idea To Impact — A Journey Into Entrepreneurship
          </h2>
          <p className="text-base xl:text-lg font-light text-off-black/80 leading-relaxed text-justify">
            What began as simple conversations soon evolved into a journey fueled by passion, vision,
            and relentless dedication. From the world of entrepreneurship emerged Mutual — a brand
            built on purpose, authenticity, and a clear commercial mission. Rooted in creativity and
            guided by integrity, Mutual represents the spirit of doing things right and building
            something that lasts.
          </p>
        </div>
        {/* Three-image row */}
        <section className="mx-auto  rounded-2xl overflow-hidden z-[99999] -mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 ">
            {[
              { src: AboutImg1, alt: "The Mutual story" },
              { src: AboutImg2, alt: "Building the brand" },
              { src: AboutImg3, alt: "Mutual products" },
            ].map((img, i) => (
              <div
                key={i}
                className="reveal relative h-56 xl:h-72  overflow-hidden shadow-md"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <Image src={img.src} alt={img.alt} fill className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      </section>

    </main>
  )
}
