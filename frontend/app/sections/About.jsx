import React from 'react'
import { AboutImage, AboutText, Header } from '../components'

function About() {
  return (
    <section className='bg-off-transparent -mx-20 px-20 py-12 flex gap-32 justify-between'>
        <AboutText />
        <AboutImage />
    </section>
  )
}

export default About