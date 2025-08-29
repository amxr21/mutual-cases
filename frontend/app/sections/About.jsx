import React from 'react'
import { AboutImage, AboutText, Header, MainSection } from '../components'

function About() {
  return (
    <MainSection classes='flex-row bg-off-transparent -mx-20 px-20 py-16 flex gap-32 justify-between'>
      <AboutText />
      <AboutImage />
    </MainSection>
  )
}

export default About