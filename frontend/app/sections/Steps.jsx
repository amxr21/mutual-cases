import React from 'react'
import { Header } from '../components';
import Step from '../components/Step';

import { step1, step2, step3, step4 } from "../constants/imags"

const text = {
    'en': [
        {text: { h: 'Start with the Design', p: "Whether it’s a bold graphic, a clean minimal layout, or a city-inspired vibe — our process begins with fresh, on-trend designs tailored for your device.We’re always creating, sketching, and curating to keep your cover style sharp." }, image: step1},
        {text: { h: 'Apply with Precision', p: "Once you choose your favorite, we carefully apply the design to the right-fit cover using durable materials and scratch-resistant finishes. Each piece is aligned, sealed, and quality-checked by hand." }, image: step2},
        {text: { h: 'Review & Verify', p: "Before it leaves us, your item is inspected to ensure it's flawless. We double-check print quality, fit, and finish — no dust, no smudges, no slip-ups." }, image: step3},
        {text: { h: 'Pack It, Ready to Go', p: "Finally, we wrap it in clean, protective packaging that keeps it safe and looking fresh. It’s then prepped for fast delivery, so it shows up ready to impress." }, image: step4},
    ]
} 



function Steps() {
  return (
    <section className='flex flex-col gap-10'>
        <Header headerText='How We Make Your Order' subheader={true} subheaderText='From concept to your doorstep — every cover goes through a thoughtful, hands-on process.' textAlignment='center' mark={true} markClasses='grow w-40 flex justify-center -top-6 right-[35%]' textColor='' />

        <div className='flex flex-col gap-15'>
            {
                text['en'].map((step, index) => {
                    return (
                        <Step key={index} classes={index % 2 ? '' : 'flex-row-reverse'} header={step.text.h} paragraph={step.text.p} imageSrc={step.image} />
                    )
                })
            }

        </div>

        

    </section>
  )
}

export default Steps