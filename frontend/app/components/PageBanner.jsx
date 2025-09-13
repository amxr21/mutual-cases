"use client"

import Image from "next/image"
import { Header } from "./index"
import { Cases } from "../constants/imags"

import { usePathname } from "next/navigation"


function PageBanner() {

  const pathname = usePathname()

  console.log(pathname, 'current route');
  
  let currentPath = String(pathname).split("/")[1] == 'products' ? 'Cases' : String(pathname).split("/")[1]

  return (
    <div className="relative page-banner -mx-8 xl:-mx-20 px-10 xl:px-20 py-12 overflow-hidden h-44 flex items-center justify-center mb-10 z-[-99]">
        <Image src={Cases} alt="cases" className="absolute inset-0 w-full h-full object-cover" />
        <Header headerText={currentPath} subheader={true} subheaderText={`Home / ${currentPath}`} textAlignment="" textColor="white"  />
    </div>
  )
}

export default PageBanner