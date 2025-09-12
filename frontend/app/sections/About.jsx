import React from 'react'
import { AboutImage, AboutText, Header, MainSection } from '../components'

function About() {
  return (
    // mx-8 xl:mx-20 my-3 xl:my-6
    <MainSection classes=' items-center flex-col xl:flex-row bg-off-transparent py-10 xl:py-16 px-8 -mx-8 xl:px-20 xl:-mx-20 flex gap-8 xl:gap-32  '>
      <AboutText />
      <AboutImage />
    </MainSection>
  )
}

export default About