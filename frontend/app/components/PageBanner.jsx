"use client"

import Image from "next/image"
import { Header } from "./index"
import { Cases } from "../constants/imags"

import { usePathname } from "next/navigation"


// Routes that render their own dedicated hero — the generic banner is skipped.
const SKIP_BANNER = new Set(['custom-it'])

function PageBanner() {

  const pathname = usePathname()

  const segment = String(pathname).split("/")[1]

  // Don't show the generic banner on pages with their own hero.
  if (SKIP_BANNER.has(segment)) return null

  let currentPath = segment == 'products' ? 'Cases' : segment

  return (
    <div className="relative page-banner -mx-8 xl:-mx-20 px-10 xl:px-20 py-12 overflow-hidden h-44 flex items-center justify-center mb-10 z-[-99]">
        <Image src={Cases} alt="cases" className="absolute inset-0 w-full h-full object-cover" />
        <Header headerText={currentPath} subheader={true} subheaderText={`Home / ${currentPath}`} textAlignment="" textColor="white"  />
    </div>
  )
}

export default PageBanner